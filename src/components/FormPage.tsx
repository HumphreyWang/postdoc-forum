import {getTranslations} from 'next-intl/server';
import {deadlinePassed, forum} from '@/lib/forum';
import SubmissionForm from './SubmissionForm';
export default async function FormPage() {
  const t=await getTranslations('form');const c=await getTranslations('common');
  const closed=deadlinePassed('registration')||process.env.FORUM_FORMS_ENABLED==='false';
  return <div className="container section"><header className="page-heading"><p className="eyebrow">JOIN THE FORUM / 2026</p><h1>{t('registrationTitle')}</h1><p>{t('registrationIntro')}</p></header>
    <div className="form-layout"><aside className="form-aside"><div className="card"><span className="status-badge">{c('tentative')}</span>
      <div className="deadline-block"><p>{t('talkPosterDeadline')}</p><h2>{forum.abstractDeadline}</h2></div>
      <div className="deadline-block"><p>{t('registrationDeadline')}</p><h2>{forum.registrationDeadline}</h2></div>
      <p className="field-hint">{t('deadlineTime')}</p><hr/><p>{t('privacy')}</p>
    </div><div className="form-guide"><h3>{t('oneForm')}</h3><p>{t('oneFormHelp')}</p></div></aside>
    {closed?<div className="notice" role="status">{t('closed')}</div>:<SubmissionForm abstractClosed={deadlinePassed('abstract')}/>}
    </div></div>;
}
