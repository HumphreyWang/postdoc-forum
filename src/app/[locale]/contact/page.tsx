import {getTranslations, setRequestLocale} from 'next-intl/server';
import Committees from '@/components/Committees';

export default async function Contact({params}: {params:Promise<{locale:string}>}) {
  const {locale}=await params;
  setRequestLocale(locale);
  const t=await getTranslations('contact');
  return <div className="container section">
    <header className="page-heading"><p className="eyebrow">CONTACT / 2026</p><h1>{t('title')}</h1><p>{t('intro')}</p></header>
    <Committees showEmails/>
    <div className="card contact-details"><p>{t('note')}</p><h2>{t('links')}</h2><div className="footer-links">
      <a className="text-link" href="https://kiaa.pku.edu.cn/index.htm" target="_blank" rel="noreferrer">KIAA · Peking University ↗</a>
      <a className="text-link" href="https://astro.tsinghua.edu.cn/en/" target="_blank" rel="noreferrer">DoA · Tsinghua University ↗</a>
    </div></div>
  </div>;
}
