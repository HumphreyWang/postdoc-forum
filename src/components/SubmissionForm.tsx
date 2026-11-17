'use client';

import {useEffect, useRef, useState, type FormEvent} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {discussionTopics as discussionChoices, documentTypes, forum, requiresAbstract, roles, topics} from '@/lib/forum';

type Receipt = {id: string; kind: string; createdAt: string; status: string; includesAbstract: boolean};
type Values = Record<string, string>;
const personalFields = ['name','email','affiliation','role','preference','documentType'];
const researchFields = ['title','authors','affiliations','topic','abstract','keywords','posterFallback'];
const draftFields = [...personalFields, ...researchFields, 'discussionInterest'];
const errorCodes = ['validation','invalid_request','too_large','conflict','server_error','closed','abstract_closed'] as const;
type ErrorCode = typeof errorCodes[number] | 'network' | '';
const draftKey = 'postdoc-2026-registration-v2-draft';
const pick = (values: Values, keys: string[]) => Object.fromEntries(keys.map(key => [key, values[key] || '']));

export default function SubmissionForm({abstractClosed = false}: {abstractClosed?: boolean}) {
  const t = useTranslations('form'); const locale = useLocale();
  const [values, setValues] = useState<Values>({});
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [consent, setConsent] = useState(false);
  const [campusConsent, setCampusConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorCode>('');
  const [invalid, setInvalid] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const requestId = useRef(''); const submitting = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const passport = values.documentType === 'passport';
  const presenting = requiresAbstract(values.preference || '');
  const presentationClosed = abstractClosed && presenting;
  useEffect(() => { if (receipt || error) resultRef.current?.focus(); }, [receipt, error]);

  const update = (name: string, value: string) => {
    setValues(current => ({...current, [name]: value,
      ...(name === 'documentType' && value !== 'passport' ? {nationality: ''} : {}),
      ...(name === 'preference' && value !== 'oral' ? {posterFallback: ''} : {})
    }));
    if (name === 'documentType' && value !== 'passport') {
      setPassportPhoto(null);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
    setInvalid(current => {const copy = {...current}; delete copy[name]; return copy;});
  };
  const choosePhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    const error = file && file.size > forum.passportPhotoMaxBytes ? 'file_size' :
      file && !['image/jpeg', 'image/png'].includes(file.type) ? 'file_type' : '';
    setPassportPhoto(error ? null : file);
    setInvalid(current => {const copy = {...current}; if (error) copy.passportPhoto = error; else delete copy.passportPhoto; return copy;});
    if (error) event.target.value = '';
  };
  const toggleTopic = (topic: string, checked: boolean) => {
    setSelectedTopics(current => checked ? [...current, topic] : current.filter(value => value !== topic));
    setInvalid(current => {const copy = {...current}; delete copy.discussionTopics; return copy;});
  };
  const draft = (action: 'save' | 'load' | 'clear') => {
    try {
      if (action === 'save') {
        localStorage.setItem(draftKey, JSON.stringify({...pick(values, draftFields), discussionTopics: selectedTopics})); setNotice('draftSaved');
      } else if (action === 'clear') {
        localStorage.removeItem(draftKey); setNotice('draftCleared');
      } else {
        const saved = JSON.parse(localStorage.getItem(draftKey) || 'null');
        if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {setNotice('draftMissing'); return;}
        const safe = Object.fromEntries(draftFields.filter(key => typeof saved[key] === 'string').map(key => [key, saved[key]]));
        setSelectedTopics(discussionChoices.filter(topic => Array.isArray(saved.discussionTopics) && saved.discussionTopics.includes(topic)));
        if (safe.preference === 'either') safe.preference = '';
        // Campus-entry identity details and files are never restored from a browser draft.
        setValues({...safe, documentNumber: '', nationality: ''}); setPassportPhoto(null);
        if (photoInputRef.current) photoInputRef.current.value = '';
        setConsent(false); setCampusConsent(false); setNotice('draftLoaded');
      }
    } catch {setNotice('draftUnavailable');}
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || presentationClosed) return;
    submitting.current = true; setBusy(true); setError(''); setInvalid({}); setNotice('');
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), passport ? 60000 : 20000);
    try {
      if (!requestId.current) requestId.current = crypto.randomUUID();
      const payload = {...pick(values, personalFields), ...(presenting ? {...pick(values, researchFields),
          posterFallback: values.preference === 'oral' ? values.posterFallback : undefined} : {}),
        discussionTopics: selectedTopics, discussionInterest: values.discussionInterest || '',
        ...(passport ? {nationality: values.nationality} : {}),
        documentNumber: values.documentNumber, campusConsent, locale, consent, requestId: requestId.current};
      const formData = new FormData();
      formData.append('payload', JSON.stringify(payload));
      if (passport && passportPhoto) formData.append('passportPhoto', passportPhoto);
      const response = await fetch('/api/registrations', {
        method: 'POST', signal: controller.signal, body: formData
      });
      const result = await response.json();
      if (!response.ok) {
        setInvalid(result.fields || {});
        setError(errorCodes.includes(result.error) ? result.error : 'server_error'); return;
      }
      setReceipt(result); setValues(current => ({...current, documentNumber: '', nationality: ''})); setPassportPhoto(null);
      try {localStorage.removeItem(draftKey);} catch {setNotice('receiptDraftWarning');}
    } catch {setError('network');}
    finally {clearTimeout(timeout); setBusy(false); submitting.current = false;}
  }

  const download = () => {
    if (!receipt) return;
    // Explicit allowlist: identity numbers and consent controls never enter the receipt file.
    const content = {...receipt, event: 'AstroConnect 2026', ...pick(values, personalFields),
      discussion: {topics: selectedTopics, interest: values.discussionInterest || ''},
      ...(receipt.includesAbstract ? {presentation: {...pick(values, researchFields), posterFallback: values.preference === 'oral' ? values.posterFallback === 'yes' : undefined}} : {}), notice: t('successNote')};
    const url = URL.createObjectURL(new Blob([JSON.stringify(content,null,2)], {type:'application/json'}));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `astroconnect-2026-registration-${receipt.id}.json`;
    anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (receipt) return <div className="card receipt" role="status" ref={resultRef} tabIndex={-1}>
    <span className="success-mark" aria-hidden="true">✓</span>
    <h2>{t(receipt.includesAbstract ? 'successCombined' : 'successRegistration')}</h2><p>{t('successNote')}</p>
    <dl><dt>{t('receiptId')}</dt><dd><code>{receipt.id}</code></dd><dt>{t('receivedAt')}</dt><dd>{new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short',timeZone:forum.timeZone}).format(new Date(receipt.createdAt))} (UTC+8)</dd>
    <dt>{t('preference')}</dt><dd>{t(`formats.${values.preference}`)}</dd></dl>
    <p className="field-hint">{t('receiptPrivacy')}</p>
    <button type="button" className="button" onClick={download}>{t('download')}</button>
    {notice && <p>{t(notice)}</p>}
  </div>;

  const input = (name: string, options: {type?:string; min?:number; max?:number; optional?:boolean; multiline?:boolean; hint?:string; autoComplete?:string} = {}) => {
    const {type='text', min=1, max, optional=false, multiline=false, hint, autoComplete} = options;
    const props = {
      id: name, name, value: values[name] || '', required: !optional, minLength: optional ? undefined : min, maxLength: max,
      'aria-invalid': Boolean(invalid[name]), 'aria-describedby': [hint ? `${name}-hint` : '', invalid[name] ? `${name}-error` : ''].filter(Boolean).join(' ') || undefined,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(name,e.target.value)
    };
    return <div className="field" key={name}><label htmlFor={name}>{t(name)}{!optional && <span aria-hidden="true"> *</span>}</label>
      {multiline ? <textarea {...props} rows={name === 'abstract' ? 9 : 3}/> : <input {...props} type={type} autoComplete={autoComplete} spellCheck={name === 'documentNumber' ? false : undefined}/>}
      {hint && <p className="field-hint" id={`${name}-hint`}>{t(hint)}</p>}
      {invalid[name] && <p className="field-error" id={`${name}-error`}>{t(invalid[name] === 'word_limit' ? 'errors.abstract_word_limit' : 'errors.invalid')}</p>}
    </div>;
  };
  const select = (name: string, choices: readonly string[], prefix: string) => <div className="field" key={name}>
    <label htmlFor={name}>{t(name)} <span aria-hidden="true">*</span></label>
    <select id={name} name={name} required value={values[name] || ''} onChange={e => update(name,e.target.value)} aria-invalid={Boolean(invalid[name])} aria-describedby={invalid[name] ? `${name}-error` : undefined}>
      <option value="">{t('choose')}</option>{choices.map(value => <option key={value} value={value}>{t(`${prefix}.${value}`)}</option>)}
    </select>{invalid[name] && <p className="field-error" id={`${name}-error`}>{t('errors.invalid')}</p>}
  </div>;

  return <form className="card submission-form" onSubmit={onSubmit}>
    <p className="field-hint">{t('required')}</p>
    {error && <div className="error-summary" ref={resultRef} role="alert" tabIndex={-1}><p>{t(`errors.${error}`)}</p>
      {Object.keys(invalid).filter(key => [...draftFields,'discussionTopics','documentNumber','nationality','passportPhoto','consent','campusConsent'].includes(key)).map(key => <a href={`#${key}`} key={key}>{t(key)}</a>)}
    </div>}
    <fieldset disabled={busy}>
      <legend>{t('personal')}</legend>
      <div className="form-row">{input('name',{max:100,autoComplete:'name'})}{input('email',{type:'email',max:254,autoComplete:'email'})}</div>
      <div className="form-row">{input('affiliation',{min:2,max:200,autoComplete:'organization'})}{select('role',roles,'roles')}</div>
      <section className="campus-section" aria-labelledby="campus-heading">
        <h2 id="campus-heading" className="form-section-title">{t('campusTitle')}</h2>
        <p className="section-description">{t('campusPurpose')}</p>
        <div className="form-row">{select('documentType',documentTypes,'documentTypes')}{input('documentNumber',{min:5,max:40,autoComplete:'off'})}</div>
        {passport && <div className="passport-fields">
          {input('nationality',{min:2,max:100,autoComplete:'off'})}
          <div className="field">
            <label htmlFor="passportPhoto">{t('passportPhoto')} <span aria-hidden="true">*</span></label>
            <input ref={photoInputRef} id="passportPhoto" name="passportPhoto" type="file" accept="image/jpeg,image/png" required onChange={choosePhoto}
              aria-invalid={Boolean(invalid.passportPhoto)} aria-describedby={`passportPhoto-hint${invalid.passportPhoto?' passportPhoto-error':''}`}/>
            <p className="field-hint" id="passportPhoto-hint">{t('passportPhotoHelp')}</p>
            {invalid.passportPhoto && <p id="passportPhoto-error" className="field-error">{t(['file_size','file_type','invalid_image'].includes(invalid.passportPhoto)?`errors.photo_${invalid.passportPhoto}`:'errors.invalid')}</p>}
          </div>
        </div>}
        <div className="consent"><input id="campusConsent" type="checkbox" required checked={campusConsent} onChange={e=>setCampusConsent(e.target.checked)} aria-invalid={Boolean(invalid.campusConsent)}/><label htmlFor="campusConsent">{t('campusConsent')}</label></div>
      </section>
      <section id="presentation" aria-labelledby="participation-heading">
        <h2 id="participation-heading" className="form-section-title">{t('participation')}</h2>
        <div id="preference" className="participation-options" role="radiogroup" aria-label={t('preference')} aria-required="true" aria-describedby="participation-help">
          {(['attend','oral','poster'] as const).map(format=><label key={format} className={`participation-option ${values.preference===format?'selected':''} ${abstractClosed&&format!=='attend'?'unavailable':''}`}>
            <input type="radio" name="preference" value={format} checked={values.preference===format} required disabled={abstractClosed&&format!=='attend'} onChange={e=>update('preference',e.target.value)}/>
            <span><strong>{t(`formats.${format}`)}</strong><small>{t(format==='attend'?'noAbstract':format==='poster'?'posterDescription':'talkDescription')}</small></span>
          </label>)}
        </div>
        <p id="participation-help" className="field-hint">{t(abstractClosed?'abstractClosed':'participationHelp')}</p>
        {invalid.preference && <p className="field-error">{t('errors.invalid')}</p>}
        {values.preference === 'oral' && <div className="talk-fallback" id="posterFallback" role="group" aria-labelledby="poster-fallback-label">
          <p id="poster-fallback-label" className="fallback-label">{t('posterFallback')} <span aria-hidden="true">*</span></p>
          <div className="fallback-options">{(['yes','no'] as const).map(answer => <label key={answer}>
            <input type="radio" name="posterFallback" value={answer} checked={values.posterFallback===answer} required onChange={event=>update('posterFallback',event.target.value)}/>
            <span>{t(`answers.${answer}`)}</span>
          </label>)}</div>
          <p className="field-hint">{t('posterFlashHelp')}</p>
          {invalid.posterFallback && <p className="field-error">{t('errors.invalid')}</p>}
        </div>}
        {presenting && <div className="abstract-fields" data-testid="abstract-fields">
          <h3>{t('research')}</h3><p className="field-hint">{t('abstractDeadline',{date:forum.abstractDeadline})}</p>
          {input('title',{min:5,max:250})}{input('authors',{min:2,max:1000,hint:'authorsHelp'})}
          {input('affiliations',{min:2,max:1000,multiline:true})}{select('topic',topics,'topics')}
          {input('abstract',{multiline:true,hint:'abstractHelp'})}
          {input('keywords',{optional:true,max:200})}
        </div>}
      </section>
      <section className="discussion-section" aria-labelledby="discussion-heading">
        <h2 id="discussion-heading" className="form-section-title">{t('discussionTitle')}</h2>
        <p className="section-description" id="discussion-help">{t('discussionHelp')}</p>
        <div id="discussionTopics" className="discussion-options" role="group" aria-label={t('discussionTopics')} aria-describedby="discussion-help">
          {discussionChoices.map(topic => <label key={topic} className={`discussion-option ${selectedTopics.includes(topic) ? 'selected' : ''}`}>
            <input type="checkbox" name="discussionTopics" value={topic} checked={selectedTopics.includes(topic)} onChange={event => toggleTopic(topic, event.target.checked)}/>
            <span>{t(`discussionLabels.${topic}`)}</span>
          </label>)}
        </div>
        {invalid.discussionTopics && <p className="field-error">{t('errors.invalid')}</p>}
        {input('discussionInterest',{optional:true,max:1000,multiline:true,hint:'discussionInterestHelp'})}
      </section>
      <div className="consent"><input id="consent" type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)} aria-invalid={Boolean(invalid.consent)}/><label htmlFor="consent">{t('consent')}</label></div>
      <button className="button submit-button" type="submit" disabled={busy||presentationClosed}>{busy?t('submitting'):t(presenting?'submitCombined':'submitRegistration')}</button>
      <div className="draft-actions"><button type="button" onClick={()=>draft('save')}>{t('saveDraft')}</button><button type="button" onClick={()=>draft('load')}>{t('loadDraft')}</button><button type="button" onClick={()=>draft('clear')}>{t('clearDraft')}</button></div>
      <p className="field-hint">{t('draftHint')}</p>
    </fieldset>
    {notice && <p className="draft-status" role="status">{t(notice)}</p>}
  </form>;
}
