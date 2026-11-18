import {getTranslations, setRequestLocale} from 'next-intl/server';
import Link from 'next/link';
export default async function Program({params}: {params:Promise<{locale:string}>}) {
 const {locale}=await params; setRequestLocale(locale); const t=await getTranslations('program');const c=await getTranslations('common');
 return <div className="container section"><header className="page-heading"><p className="eyebrow">PROGRAMME / 2026</p><h1>{t('title')}</h1><p>{t('intro')}</p></header><div className="three-col programme-sessions">{['talks','posters','discussion'].map(k=><article className="card" key={k}><h2>{t(k)}</h2><p>{t(`${k}Text`)}</p></article>)}</div><section className="callout"><h2>{t('cta')}</h2><p>{t('ctaText')}</p><div className="button-row"><Link className="button" href={`/${locale}/registration`}>{c('register')}</Link></div></section></div>;
}
