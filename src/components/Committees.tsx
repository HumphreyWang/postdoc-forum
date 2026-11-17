import {getTranslations} from 'next-intl/server';
import {committees} from '@/lib/committees';

export default async function Committees({showEmails = false}: {showEmails?: boolean} = {}) {
  const t = await getTranslations('committees');
  return <section id="committees" className={`committees-section${showEmails ? ' committees-with-email' : ''}`} aria-labelledby="committees-heading">
    <header className="section-heading"><h2 id="committees-heading">{t('title')}</h2><p>{t('intro')}</p></header>
    <div className="committee-grid">
      {(['soc', 'loc'] as const).map(kind => <article id={kind} className="committee-panel" key={kind} aria-labelledby={`${kind}-heading`}>
        <h3 id={`${kind}-heading`}>{t(kind)}</h3>
        <table className="committee-table" aria-labelledby={`${kind}-heading`}>
          <thead><tr><th scope="col">{t('member')}</th><th scope="col">{t('affiliation')}</th>{showEmails && <th scope="col">{t('email')}</th>}</tr></thead>
          <tbody>{committees[kind].map((member, index) => <tr key={`${kind}-${index}`} className={!member.name ? 'committee-placeholder' : undefined}>
            <td className="committee-name">{member.name || t('pending')}</td><td className="committee-affiliation">{member.affiliation || t('pending')}</td>
            {showEmails && <td className="committee-email" data-label={t('email')}>
              {member.email?.trim() ? <a href={`mailto:${member.email.trim()}`}>{member.email.trim()}</a> : <span className="committee-email-pending">{t('pending')}</span>}
            </td>}
          </tr>)}</tbody>
        </table>
      </article>)}
    </div>
  </section>;
}
