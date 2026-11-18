import {getTranslations, setRequestLocale} from 'next-intl/server';
import Image from 'next/image';
export default async function Venue({params}: {params:Promise<{locale:string}>}) {
 const {locale}=await params;setRequestLocale(locale);const t=await getTranslations('venue');
 const places=[{key:'kiaa',day:'14 December',university:'pku',url:'https://kiaa.pku.edu.cn/index.htm',pdf:'/Map%20of%20KIAA.pdf'},{key:'doa',day:'15 December',university:'thu',url:'https://astro.tsinghua.edu.cn/en/',pdf:'/Map%20of%20DoA.pdf'}];
 return <div className="container section"><header className="page-heading"><p className="eyebrow">VENUE / BEIJING</p><h1>{t('title')}</h1><p>{t('intro')}</p></header><div className="two-col">{places.map(p=><article className="card" key={p.key}><p className="eyebrow">{p.day} · {t(p.university)}</p><h2>{t(p.key)}</h2><a className="text-link" href={p.url} target="_blank" rel="noreferrer">{t('website')} ↗</a><div className="map-wrap"><Image src={`/map-${p.key}.png`} alt={`${t(p.university)} — ${t('map')}`} width={900} height={650} className="campus-map"/></div><a className="button secondary" href={p.pdf} download>{t('download')}</a></article>)}</div></div>;
}
