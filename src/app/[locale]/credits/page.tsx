import {setRequestLocale} from 'next-intl/server';
import {heroBackgrounds} from '@/lib/hero';

export default async function ImageCredits({params}: {params: Promise<{locale:string}>}) {
  const {locale}=await params; setRequestLocale(locale);
  return <div className="container section narrow">
    <header className="page-heading"><h1>Image credits</h1><p>Sources and full attribution for the JWST images included with this website.</p></header>
    <div className="image-credits-list">{Object.values(heroBackgrounds).map(image => <article className="card" key={image.src}>
      <h2>{image.title}</h2><p><strong>Credit:</strong> {image.credit}</p>
      <p><a className="text-link" href={image.source} target="_blank" rel="noreferrer">Original image and source</a></p>
      <p><a className="text-link" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">Creative Commons Attribution 4.0</a></p>
      <p className="field-hint">The homepage display uses cropping, reduced brightness and saturation for text readability. The original image files are unchanged.</p>
    </article>)}</div>
  </div>;
}
