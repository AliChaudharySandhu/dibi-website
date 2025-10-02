function includeHTML(id, file) {
    fetch(file)
      .then(response => {
        if (!response.ok) throw new Error("Network error");
        return response.text();
      })
      .then(data => {
        document.getElementById(id).innerHTML = data;
      })
      .catch(error => {
        console.error("Error loading include:", file, error);
      });
  }
  
  // Call this after DOM loads
  document.addEventListener("DOMContentLoaded", () => {
    // Navbar
    if (document.getElementById("navbar")) {
      includeHTML("navbar", "partials/navbar.html");
    }
    // Footer
    if (document.getElementById("footer")) {
      includeHTML("footer", "partials/footer.html");
    }
  });


// ------ Nav and Footer Partials Language Translator Helpers -------------//

// --- Detect locale robustly (works for /id/... and /Dibi-Website/id/...)
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

// --- Load dictionary
async function loadI18n(locale) {
  const url = 'assets/i18n/' + locale + '.json'; // resolved by <base> if present
  const res = await fetch(url, { cache: 'no-store' });
  return res.json();
}

// --- Apply i18n text to a DOM subtree
function applyI18n(root, dict) {
  root.querySelectorAll('[data-i18n]').forEach(node => {
    const key = node.getAttribute('data-i18n');
    if (dict[key] != null) node.textContent = dict[key];
  });
}

// --- Rewrite locale in internal links inside a subtree
function rewriteLocaleLinks(root, locale) {
  root.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^https?:\/\//i.test(href)) return;
    // Replace leading en/ or id/ (with or without starting slash)
    a.setAttribute('href', href.replace(/^\/?(en|id)\//, locale + '/'));
  });
}

// --- Include partial(s)
async function includePartials(locale, dict) {
  console.log(locale, dict, 'varrrr')
  const slots = document.querySelectorAll('[data-include]');
  await Promise.all([...slots].map(async el => {
    const name = el.getAttribute('data-include'); // "navbar", "footer", etc.
    const url  = 'partials/' + name + '.html';    // resolved by <base>
    const html = await fetch(url, { cache: 'no-store' }).then(r => r.text());
    el.innerHTML = html;

    applyI18n(el, dict);
    rewriteLocaleLinks(el, locale);

    // Wire language dropdown in this partial (if present)
    el.querySelectorAll('.dropdown-item[data-lang]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        setLocale(item.dataset.lang);
      });
    });
  }));
}

// --- Change locale (navigate to /en/ or /id/ if present)
async function setLocale(locale) {
  if (locale !== 'en' && locale !== 'id') return;
  localStorage.setItem('locale', locale);
  document.documentElement.lang = locale;

  const segs = location.pathname.split('/').filter(Boolean);
  const i = segs.findIndex(s => /^(en|id)$/i.test(s));

  // If URL already has /en/ or /id/, replace it and navigate
  if (i >= 0) {
    segs[i] = locale;
    const newPath = '/' + segs.join('/') + location.search + location.hash;
    if (newPath !== location.pathname) {
      location.assign(newPath);
      return;
    }
  }

  // Otherwise just re-apply i18n in-place
  const dict = await loadI18n(locale);
  applyI18n(document.body, dict);
  rewriteLocaleLinks(document, locale);
}

// --- Boot
(async function () {
  const locale = detectLocale();
  document.documentElement.lang = locale;
  const dict = await loadI18n(locale);

  // Include and translate navbar/footer (or any [data-include])
  await includePartials(locale, dict);
})();

// --------------------------- Partials Helper End ------------------//