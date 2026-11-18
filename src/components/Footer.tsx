import {getLocale, getTranslations} from 'next-intl/server';
import Link from 'next/link';
import ForumWordmark from './ForumWordmark';
export default async function Footer() {
 const t = await getTranslations('footer'); const n = await getTranslations('nav'); const locale = await getLocale();
 return <footer className="footer"><div className="container footer-grid"><div><p className="brand"><ForumWordmark/></p><p>{t('hosted')}</p><small>{t('note')}</small></div><div className="footer-links"><strong>{t('links')}</strong>{['registration','program','contact','credits'].map(k=><Link key={k} href={`/${locale}/${k}`}>{n(k)}</Link>)}</div><div className="footer-links"><a href="https://kiaa.pku.edu.cn/index.htm" target="_blank" rel="noreferrer">KIAA · Peking University ↗</a><a href="https://astro.tsinghua.edu.cn/en/" target="_blank" rel="noreferrer">DoA · Tsinghua University ↗</a></div></div><div className="container copyright">{t('copyright')}</div></footer>;
}
