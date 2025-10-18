// Detect locale from first path segment
function detectLocale() {
  const parts = location.pathname.split('/').filter(Boolean);
  const i = parts.findIndex(s => s === 'en' || s === 'id');
  return i >= 0 ? parts[i] : 'en'; // default to 'en' if not found
}
const locale = detectLocale();
document.documentElement.lang = locale;

// Load a partial by relative path (relative to the current page)
async function includeHTML(elId, partialPath) {
  const el = document.getElementById(elId);
  if (!el) return;
  const res = await fetch(partialPath, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load partial: ${partialPath}`);
  el.innerHTML = await res.text();
}

// Language switch → same filename on other locale
function wireLanguageSwitch() {
  const page = (location.pathname.split('/').pop() || 'index.html');
  if (locale === 'en') {
    const link = document.getElementById('link-id');
    if (link) link.setAttribute('href', `../id/${page}`);
  } else {
    const link = document.getElementById('link-en');
    if (link) link.setAttribute('href', `../en/${page}`);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // From /en/* or /id/* pages, go up one level to reach /partials
  const navPartial = `../partials/${locale}/navbar.html`;
  const footerPartial = `../partials/${locale}/footer.html`
  await includeHTML('navbar', navPartial);
  await includeHTML('footer', footerPartial);

  wireLanguageSwitch();
});
