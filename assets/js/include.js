// ------ i18n + partials helpers ------

// Detect locale first (module scope)
function detectLocale() {
  const q = (new URLSearchParams(location.search).get('lang') || '').toLowerCase();
  if (q === 'en' || q === 'id') return q;

  const segs = location.pathname.toLowerCase().split('/').filter(Boolean);
  const byPath = segs.find(s => s === 'en' || s === 'id');
  if (byPath) return byPath;

  const stored = (localStorage.getItem('locale') || '').toLowerCase();
  if (stored === 'en' || stored === 'id') return stored;

  const htmlLang = (document.documentElement.lang || '').toLowerCase();
  if (htmlLang === 'en' || htmlLang === 'id') return htmlLang;

  const nav = (navigator.language || 'en').toLowerCase();
  return nav.startsWith('id') ? 'id' : 'en';
}
const locale = detectLocale();         // <- defined BEFORE anything uses it
document.documentElement.lang = locale;

async function loadI18n(loc) {
  const url = 'assets/i18n/' + loc + '.json';
  const res = await fetch(url, { cache: 'no-store' });
  return res.json();
}
function applyI18n(root, dict) {
  root.querySelectorAll('[data-i18n]').forEach(node => {
    const key = node.getAttribute('data-i18n');
    if (dict[key] != null) node.textContent = dict[key];
  });
}
function rewriteLocaleLinks(root, loc) {
  root.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^https?:\/\//i.test(href)) return;
    if (href === '/' || href === './' || href === '') {
      a.setAttribute('href', `${loc}/index.html`);
      return;
    }
    a.setAttribute('href', href.replace(/^\/?(en|id)\//, `${loc}/`));
  });
}

// Ensure the navbar logo (brand) link always points to the correct locale homepage
// Example: if locale = 'id', logo will link to /id/index.html instead of default /en/index.html
function setNavLocale(loc){
  const brand = document.querySelector('.navbar-brand');
  if (brand) brand.setAttribute('href', `${loc}/index.html`);
}

// Async include that also applies i18n, rewrites links, and fixes the logo when navbar loads
async function includeHTML(id, file, loc, dict) {
  const el = document.getElementById(id);
  if (!el) return;
  const res = await fetch(file);
  if (!res.ok) throw new Error('Network error');
  const html = await res.text();
  el.innerHTML = html;

  if (dict) applyI18n(el, dict);
  rewriteLocaleLinks(el, loc);

  if (file.includes('navbar')) {
    setNavLocale(loc); // now the navbar exists in the DOM
    // wire language dropdown if present
    el.querySelectorAll('.dropdown-item[data-lang]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        setLocale(item.dataset.lang);
      });
    });
  }
}

// Change locale (folder-based navigation preferred)
async function setLocale(loc) {
  if (loc !== 'en' && loc !== 'id') return;
  localStorage.setItem('locale', loc);
  document.documentElement.lang = loc;

  const segs = location.pathname.split('/').filter(Boolean);
  const i = segs.findIndex(s => /^(en|id)$/i.test(s));
  if (i >= 0) {
    segs[i] = loc;
  } else {
    if (segs.length && !/\.html?$/.test(segs[0])) segs.splice(1, 0, loc);
    else segs.unshift(loc);
  }
  const newPath = '/' + segs.join('/') + location.search + location.hash;
  if (newPath !== location.pathname) {
    location.assign(newPath);
    return;
  }
  // If we didn't navigate, re-apply i18n in place
  const dict = await loadI18n(loc);
  applyI18n(document.body, dict);
  rewriteLocaleLinks(document, loc);
  setNavLocale(loc);
}

// Boot after DOM is parsed
document.addEventListener('DOMContentLoaded', async () => {
  const dict = await loadI18n(locale);

  // Inject navbar & footer, then i18n + link rewrites happen inside includeHTML
  await includeHTML('navbar', 'partials/navbar.html', locale, dict);
  await includeHTML('footer', 'partials/footer.html', locale, dict);

  // If your page body (outside partials) also has data-i18n keys:
  applyI18n(document.body, dict);
  rewriteLocaleLinks(document, locale);
});
