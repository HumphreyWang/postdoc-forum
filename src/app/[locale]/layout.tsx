import './globals.css';
import './editorial.css';
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {routing} from '@/i18n/routing';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
export const metadata: Metadata = {
  title: {default: 'AstroConnect 2026 | PKU + THU', template: '%s | AstroConnect 2026'},
  description: 'AstroConnect 2026: the PKU + THU joint postdoctoral forum in astronomy and astrophysics. Conference information, registration and abstract submission.',
  robots: {index: true, follow: true}
};
export function generateStaticParams() { return routing.locales.map(locale => ({locale})); }
export default async function LocaleLayout({children, params}: {
  children: React.ReactNode; params: Promise<{locale: string}>
}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages({locale});
  return <html lang={locale}><body>
    <NextIntlClientProvider locale={locale} messages={messages}>
      <a className="skip-link" href="#main">Skip to content</a>
      <Navigation /><main id="main">{children}</main><Footer />
    </NextIntlClientProvider>
  </body></html>;
}
