// Export the public, rendered site as one offline HTML file. No private data is read.
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const project = path.resolve(__dirname, '..');
const publicRoot = path.join(project, 'public');
const base = process.env.PREVIEW_BASE_URL || 'http://localhost:3000';
const output = path.resolve(process.argv[2] || path.join(project, '..', 'AstroConnect-2026-preview.html'));
const routes = {home:'/en', program:'/en/program', registration:'/en/registration', venue:'/en/venue', contact:'/en/contact', credits:'/en/credits'};
const mime = {'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.pdf':'application/pdf','.ico':'image/x-icon'};
const cache = new Map();
async function asset(url) {
  if (url.startsWith('data:')) return url;
  const parsed = new URL(url, base);
  if (parsed.origin !== new URL(base).origin) throw Error('Unexpected remote asset: '+parsed.origin);
  const filename = path.resolve(publicRoot, '.'+decodeURIComponent(parsed.pathname));
  if (!filename.startsWith(publicRoot+path.sep) || !mime[path.extname(filename).toLowerCase()]) throw Error('Unsupported public asset: '+parsed.pathname);
  if (!cache.has(filename)) cache.set(filename, 'data:'+mime[path.extname(filename).toLowerCase()]+';base64,'+(await fs.readFile(filename)).toString('base64'));
  return cache.get(filename);
}
function offlineLink(href, pageId) {
  if (href === '#main') return href;
  if (href.startsWith('#')) return '#'+pageId+'/'+href.slice(1);
  const parsed = new URL(href, base);
  if (parsed.origin !== new URL(base).origin) return href;
  const match = parsed.pathname.match(/^\/(?:en|zh)(?:\/(.*))?\/?$/);
  if (!match) return href;
  let route = match[1] || 'home';
  route = route.replace(/\/$/,'');
  if (route === 'abstract') return '#registration/presentation';
  if (!(route in routes)) throw Error('Unknown local route: '+href);
  return '#'+route+(parsed.hash ? '/'+parsed.hash.slice(1) : '');
}
const runtime = String.raw`
(() => {
  const main = document.getElementById('main');
  const pages = {home: main.innerHTML};
  for (const template of document.querySelectorAll('template[data-page]')) pages[template.dataset.page] = template.innerHTML;
  const names = {home:'Home', program:'Programme', registration:'Registration', venue:'Venue', contact:'Contact', credits:'Image credits'};
  const menu = document.getElementById('mobile-menu');
  const toggle = document.querySelector('.menu-toggle');
  let activePage = 'home';
  function closeMenu() {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded','false');
    toggle.textContent = '☰';
  }
  toggle.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? '×' : '☰';
  });
  function bindForm() {
    const form = main.querySelector('form');
    if (!form) return;
    form.addEventListener('submit', event => event.preventDefault());
    const refresh = () => {
      const preference = form.querySelector('input[name="preference"]:checked')?.value;
      const presenting = ['oral','poster'].includes(preference);
      const abstract = form.querySelector('.abstract-fields');
      if (abstract) {
        abstract.hidden = !presenting;
        for (const control of abstract.querySelectorAll('input,textarea,select')) control.disabled = !presenting;
      }
      const passport = form.querySelector('#documentType')?.value === 'passport';
      const passportFields = form.querySelector('.passport-fields');
      if (passportFields) {
        passportFields.hidden = !passport;
        for (const control of passportFields.querySelectorAll('input,textarea,select')) {
          control.disabled = !passport;
          if (!passport) control.value = '';
        }
      }
      const fallback = form.querySelector('.talk-fallback');
      if (fallback) {
        fallback.hidden = preference !== 'oral';
        for (const control of fallback.querySelectorAll('input')) {
          control.disabled = preference !== 'oral';
          if (preference !== 'oral') control.checked = false;
        }
      }
      for (const option of form.querySelectorAll('.participation-option,.discussion-option')) {
        option.classList.toggle('selected', Boolean(option.querySelector('input')?.checked));
      }
    };
    form.addEventListener('change', refresh);
    refresh();
  }
  function render() {
    const parts = location.hash.slice(1).split('/');
    const pageId = Object.prototype.hasOwnProperty.call(pages, parts[0]) ? parts[0] : 'home';
    let anchor = '';
    try { anchor = decodeURIComponent(parts.slice(1).join('/')); } catch {}
    if (pageId !== activePage) {
      main.innerHTML = pages[pageId];
      activePage = pageId;
      bindForm();
    }
    for (const link of document.querySelectorAll('.nav-link')) {
      const selected = link.getAttribute('href') === '#'+pageId;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
    }
    document.title = (pageId === 'home' ? 'AstroConnect 2026' : names[pageId]+' | AstroConnect 2026')+' — Offline copy';
    document.getElementById('preview-route-status').textContent = names[pageId];
    closeMenu();
    requestAnimationFrame(() => {
      const target = anchor && main.querySelector('#'+CSS.escape(anchor));
      if (target) target.scrollIntoView(); else window.scrollTo(0,0);
    });
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href === '#main') {
      event.preventDefault(); main.focus({preventScroll:true}); main.scrollIntoView(); return;
    }
    if (href.startsWith('#') && Object.prototype.hasOwnProperty.call(pages, href.slice(1).split('/')[0])) {
      event.preventDefault();
      if (location.hash === href) render(); else location.hash = href;
    }
  });
  window.addEventListener('hashchange', render);
  bindForm();
  render();
})();
`;
let browser;
(async () => {
  browser = await chromium.launch({headless:true, ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const pages = {};
  let header = '', footer = '', styles = '';
  for (const [pageId, route] of Object.entries(routes)) {
    const response = await page.goto(new URL(route, base).href);
    if (!response || response.status() !== 200) throw Error('Page unavailable: '+route);
    await page.locator('main h1').waitFor();
    if (pageId === 'registration') {
      const documentType = page.locator('#documentType');
      if (await documentType.count()) {
        await documentType.selectOption('passport');
        await page.locator('.passport-fields').waitFor();
      }
      const choice = page.locator('input[name="preference"][value="oral"]');
      if (await choice.count() && await choice.isEnabled()) {
        await choice.check();
        await page.locator('.abstract-fields').waitFor();
      }
    }
    // Inline only observed public image/PDF URLs, never API responses or private files.
    const urls = await page.evaluate(() => [...new Set([
      ...Array.from(document.querySelectorAll('main img')).map(img=>img.getAttribute('src')),
      ...Array.from(document.querySelectorAll('main a[download]')).map(a=>a.getAttribute('href'))
    ].filter(Boolean))]);
    const assets = {};
    for (const url of urls) assets[url] = await asset(url);
    const links = await page.evaluate(() => [...new Set(Array.from(document.querySelectorAll('.site-header a, main a, footer a')).map(a=>a.getAttribute('href')).filter(Boolean))]);
    const hrefs = {};
    for (const href of links) hrefs[href] = assets[href] || offlineLink(href, pageId);
    const snapshot = await page.evaluate(({assets, hrefs, pageId}) => {
      const main = document.querySelector('main');
      for (const script of main.querySelectorAll('script,link,meta')) script.remove();
      for (const img of main.querySelectorAll('img')) {
        const source = img.getAttribute('src');
        img.removeAttribute('srcset'); img.removeAttribute('sizes'); img.removeAttribute('data-nimg');
        img.src = assets[source]; img.loading = 'eager';
      }
      for (const a of document.querySelectorAll('.site-header a, main a, footer a')) {
        const original = a.getAttribute('href');
        if (a.hasAttribute('download')) a.setAttribute('download', decodeURIComponent(original.split('/').pop()));
        a.setAttribute('href', hrefs[original]);
        if (/^https?:/.test(a.getAttribute('href'))) {a.target='_blank';a.rel='noopener noreferrer';}
      }
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_COMMENT);
      const comments=[];while(walker.nextNode())comments.push(walker.currentNode);comments.forEach(comment=>comment.remove());
      if (pageId === 'registration') {
        const form = main.querySelector('form');
        if (form) {
          form.setAttribute('autocomplete','off');
          form.setAttribute('onsubmit','return false');
          form.removeAttribute('action');
          for (const control of form.querySelectorAll('input')) {
            if (control.type === 'radio' || control.type === 'checkbox') {
              control.checked=false;control.defaultChecked=false;control.removeAttribute('checked');
            } else {control.value='';control.setAttribute('value','');}
          }
          for (const textarea of form.querySelectorAll('textarea')) {textarea.value='';textarea.textContent='';}
          for (const select of form.querySelectorAll('select')) {
            for (const option of select.options) {option.selected=false;option.removeAttribute('selected');}
            select.selectedIndex=0;
          }
          for (const option of form.querySelectorAll('.selected')) option.classList.remove('selected');
          for (const group of form.querySelectorAll('.abstract-fields,.passport-fields,.talk-fallback')) {
            group.hidden=true;
            for (const input of group.querySelectorAll('input,textarea,select'))input.disabled=true;
          }
          const drafts=form.querySelector('.draft-actions');
          if (drafts) {if (drafts.nextElementSibling?.classList.contains('field-hint'))drafts.nextElementSibling.remove();drafts.remove();}
          const submit=form.querySelector('.submit-button');
          submit.type='button';submit.disabled=true;submit.classList.add('offline-submit');submit.textContent='Online registration required';
          const notice=document.createElement('p');notice.className='offline-form-notice';notice.textContent='This is an offline copy of the website. Complete your registration and submit any passport materials on the online conference website. This file does not send or save information.';
          form.prepend(notice);
          const guide=main.querySelector('.form-guide p');if(guide)guide.textContent='Submission, draft saving and receipts are available on the online conference website.';
        }
      }
      if (pageId === 'contact') {
        const note=main.querySelector('.contact-details > p');if(note)note.textContent='To register or submit an abstract, please use the online conference website.';
      }
      const sheets=[];
      for(const sheet of document.styleSheets){
        // Ignore Next.js development-overlay styles and its debug-only fonts.
        if(!sheet.href || !new URL(sheet.href).pathname.startsWith('/_next/static/css/')) continue;
        try{sheets.push(Array.from(sheet.cssRules).map(rule=>rule.cssText).join('\n'));}catch{}
      }
      if(!sheets.length)throw Error('Public site stylesheet not found');
      return {main:main.innerHTML, header:document.querySelector('.site-header').outerHTML, footer:document.querySelector('footer').outerHTML, css:sheets.join('\n')};
    }, {assets, hrefs, pageId});
    pages[pageId] = snapshot.main;
    if (pageId === 'home') {header=snapshot.header;footer=snapshot.footer;styles=snapshot.css;}
    console.log('Captured '+pageId);
  }
  // Create a menu independent of React, using the same navigation links.
  const desktopLinks = header.match(/<div class="desktop-nav">([\s\S]*?)<\/div>/)?.[1];
  if (!desktopLinks) throw Error('Navigation links not found');
  header = header.replace('</nav>', '<div id="mobile-menu" class="mobile-nav" hidden>'+desktopLinks+'</div></nav>');
  const cssUrls = [...styles.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(match=>match[1]);
  for (const url of cssUrls) {if(!url.startsWith('data:'))styles=styles.split(url).join(await asset(url));}
  styles = styles.replace(/<\/style/gi, '<\\/style');
  const extra = '[hidden]{display:none!important}main:focus{outline:none}.offline-form-notice{background:#edf3fc;border:1px solid #cbdcf4;border-radius:6px;padding:16px;color:#294d7c;font-size:13px;margin-bottom:24px}.offline-submit:disabled{cursor:not-allowed;opacity:.65}';
  const templates = Object.entries(pages).filter(([id])=>id!=='home').map(([id,html])=>'<template data-page="'+id+'">'+html+'</template>').join('\n');
  const cssLicense = await fs.readFile(path.join(project, 'node_modules/tailwindcss/LICENSE'), 'utf8');
  const html = '<!doctype html>\n<!-- Tailwind CSS license for the embedded base styles:\n'+cssLicense+'\n-->\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>AstroConnect 2026 — Offline copy</title><style>'+styles+'\n'+extra+'</style></head><body>'+
    '<a class="skip-link" href="#main">Skip to content</a>'+header+
    '<main id="main" tabindex="-1">'+pages.home+'</main>'+footer+templates+
    '<div class="sr-only" id="preview-route-status" aria-live="polite"></div><noscript><p class="notice">Enable JavaScript to view the other pages and form interactions. The homepage remains available below the navigation.</p></noscript><script>'+runtime+'</script></body></html>\n';
  if (/localhost|127\.0\.0\.1|\/_next\/|\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/.test(html)) throw Error('Unexpected server/runtime dependency in export');
  await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,html,'utf8');
  console.log('Created '+output+' ('+(Buffer.byteLength(html)/1024/1024).toFixed(2)+' MiB).');
})().catch(error=>{console.error(error);process.exitCode=1}).finally(async()=>{await browser?.close();});
