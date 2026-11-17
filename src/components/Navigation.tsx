'use client';
import {useLocale, useTranslations} from 'next-intl';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useState} from 'react';
export default function Navigation() {
  const t = useTranslations('nav');
  const locale = useLocale(); const pathname = usePathname(); const [open, setOpen] = useState(false);
  const items = ['home', 'program', 'registration', 'venue', 'contact'];
  const links = items.map(key => {
    const href = `/${locale}${key === 'home' ? '' : `/${key}`}`;
    return <Link key={key} href={href} onClick={() => setOpen(false)} aria-current={pathname === href ? 'page' : undefined}
      className={`nav-link ${pathname === href ? 'active' : ''}`}>{t(key)}</Link>;
  });
  return <header className="site-header"><nav className="container nav-inner" aria-label="Main navigation">
    <Link href={`/${locale}`} className="brand"><span className="brand-orbit" aria-hidden="true">✦</span><span>AstroConnect <b>2026</b></span></Link>
    <div className="desktop-nav">{links}</div>
    <div className="nav-actions">
    <button type="button" className="menu-toggle" aria-label={t('menu')} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>{open ? '×' : '☰'}</button></div>
    {open && <div id="mobile-menu" className="mobile-nav">{links}</div>}
  </nav></header>;
}
