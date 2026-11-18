import {getTranslations, setRequestLocale} from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import {forum, meetingDateLabel} from '@/lib/forum';
import {heroBackground} from '@/lib/hero';
import Committees from '@/components/Committees';

export default async function Home({params}: {params: Promise<{locale:string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const c = await getTranslations('common');
  return <>
    <section className="hero event-hero" aria-labelledby="event-title">
      <Image className="hero-image" src={heroBackground.src} alt="" fill preload sizes="100vw" style={{objectPosition:heroBackground.position}}/>
      <div className="hero-shade" aria-hidden="true"/>
      <div className="container hero-content">

        <h1 id="event-title">{t('title')}</h1>
        <p className="hero-subtitle">{t('subtitle')}</p>
        <div className="hero-event-details">
          <p className="hero-event-date">{meetingDateLabel}</p>
          <p>{t('heroVenue')}</p>
        </div>
        <div className="button-row">
          <Link className="button button-light" href={`/${locale}/registration`}>{c('register')}</Link>
        </div>
      </div>
      <div className="container hero-credit">
        <span>Background: JWST Image of {heroBackground.objectName}</span>
        <span>Credit: {heroBackground.institutions}</span>
      </div>
    </section>

    <div className="container overview-layout">
      <div className="overview-main">
        <section id="overview" className="overview-section" aria-labelledby="overview-heading">
          <h2 id="overview-heading">{t('overviewTitle')}</h2>
          <p className="overview-lead">{t('overviewText')}</p>
        </section>
        <section id="scientific-scope" className="overview-section" aria-labelledby="scope-heading">
          <h2 id="scope-heading">{t('scopeTitle')}</h2>
          <p>{t('scopeIntro')}</p>
          <ul className="scope-list">
            {['galaxies','stars','planets','compact','methods'].map(key => <li key={key}>{t(`scope.${key}`)}</li>)}
          </ul>
        </section>
        <section id="conference-format" className="overview-section" aria-labelledby="format-heading">
          <h2 id="format-heading">{t('formatTitle')}</h2>

          <div className="format-numbers">
            <div><span>{t('approximately')}</span><strong>{forum.approximateTalks}</strong><h3>{t('talksTitle')}</h3><p>{t('talksText')}</p></div>
            <div><span>{t('approximately')}</span><strong>{forum.approximatePosters}</strong><h3>{t('postersTitle')}</h3><p>{t('postersText')}</p></div>
          </div>
          <div className="format-details">
            <div><h3>{t('breaksTitle')}</h3><p>{t('breaksText')}</p></div>
            <div><h3>{t('discussionsTitle')}</h3><p>{t('discussionsText')}</p></div>
          </div>
          <p className="format-note">{t('formatNote')}</p>
          <Link className="text-link" href={`/${locale}/program`}>{c('learn')} →</Link>
        </section>
      </div>

      <aside className="conference-sidebar" aria-label={t('informationTitle')}>
        <section className="conference-info-panel">
          <h2>{t('informationTitle')}</h2>
          <dl className="conference-facts">
            <div><dt>{t('dateLabel')}</dt><dd>{meetingDateLabel}</dd></div>
            <div><dt>{t('locationLabel')}</dt><dd>{t('city')}</dd></div>
            <div><dt>{t('venuesLabel')}</dt><dd><ul className="venue-list"><li>{t('kiaaVenue')}</li><li>{t('doaVenue')}</li></ul></dd></div>
            <div><dt>{t('participantLabel')}</dt><dd>{t('participants',{count:forum.participantLimit})}</dd></div>
            <div><dt>{t('feeLabel')}</dt><dd>{t('fee')}</dd></div>
            <div><dt>{t('mealsLabel')}</dt><dd>{t('meals')}</dd></div>
          </dl>
          <p className="sidebar-note">{t('venueNote')}</p>
          <Link className="text-link" href={`/${locale}/venue`}>{t('venueLink')} →</Link>
        </section>
        <section className="conference-info-panel">
          <h2>{t('importantDatesTitle')}</h2>
          <dl>
            <dt>{t('abstractDeadline')}</dt><dd>{forum.abstractDeadline}</dd>
            <dt>{t('registrationDeadline')}</dt><dd>{forum.registrationDeadline}</dd>
          </dl>
          <p className="sidebar-note">{t('deadlineTime')}</p>
          <p className="sidebar-note">{t('registrationHelp')}</p>
          <Link className="button" href={`/${locale}/registration`}>{c('register')}</Link>
        </section>
      </aside>
    </div>
    <div className="container committees-container"><Committees/></div>
  </>;
}
