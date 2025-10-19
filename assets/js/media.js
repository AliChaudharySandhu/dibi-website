const dataUrl = '../assets/data/media.json';

// --- Utils
const escapeHtml = (s = '') =>
    s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const badge = (txt, cls = 'text-bg-light') =>
    `<span class="badge ${cls}">${escapeHtml(txt)}</span>`;

const formatDateLabel = (iso = '') => {
    if (!iso) return '';
    const [y, m] = iso.split('-');               // YYYY-MM or YYYY-MM-DD
    if (y && m) return `${y}-${m.padStart(2, '0')}`;
    return y || '';
};

// Truncate to N chars, end at word boundary, add ellipsis
function truncate(text = '', max = 500) {
    if (text.length <= max) return text;
    const slice = text.slice(0, max);
    const cut = slice.lastIndexOf(' ');
    return (cut > 0 ? slice.slice(0, cut) : slice).trimEnd() + '…';
}

const sortByDateDesc = (a, b) => {
    const da = a.date || '';
    const db = b.date || '';
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da < db ? 1 : da > db ? -1 : 0;
};

// --- Card template (two-row layout)
function mediaCard(m) {
    const dateLabel = formatDateLabel(m.date || '');
    const tagBadges = (m.tags || []).map(t => {
        const cls = /press|news/i.test(t) ? 'text-bg-success'
            : /project/i.test(t) ? 'text-bg-warning'
                : /announce/i.test(t) ? 'text-bg-info'
                    : 'text-bg-info';
        return badge(t, cls);
    }).join('');

    // Row 1: badges/date/title
    const headerRow = `
    <div class="mb-3">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
        ${badge(m.source || '—', 'text-bg-primary')}
        ${dateLabel ? badge(dateLabel, 'text-bg-light') : ''}
        ${tagBadges}
      </div>
      <h2 class="h5 mb-0">
        <a class="text-decoration-none" href="${escapeHtml(m.url)}" target="_blank" rel="noopener">
          ${escapeHtml(m.title || 'Untitled')}
          <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true"></i>
        </a>
      </h2>
    </div>
  `;

    // Row 2: image (col-3 on md+) + summary (col-9)
    const imgCol = m.image ? `
    <div class="col-12 col-md-3">
      <img class="media-card-img shadow-sm" src="${escapeHtml(m.image)}"
           alt="${escapeHtml(m.title || 'Media image')}" loading="lazy">
    </div>
  ` : '';

    const textColClass = m.image ? 'col-12 col-md-9' : 'col-12';
    const bodyRow = `
    <div class="row g-3 align-items-start">
      ${imgCol}
      <div class="${textColClass}">
        ${m.summary ? `<p class="text-muted mb-2">${escapeHtml(truncate(m.summary, 500))}</p>` : ''}
        <a class="btn btn-sm btn-outline-primary" href="${escapeHtml(m.url)}" target="_blank" rel="noopener">
          Read more
        </a>
      </div>
    </div>
  `;

    return `
    <article class="card border-0 shadow-sm rounded-4">
      <div class="card-body p-4">
        ${headerRow}
        ${bodyRow}
      </div>
    </article>
  `;
}

// --- Render
async function renderMedia() {
    const list = document.getElementById('media-list');
    if (!list) return;

    list.innerHTML = `
    <div class="card border-0 shadow-sm rounded-4">
      <div class="card-body p-4 text-muted">Loading media releases…</div>
    </div>`;

    try {
        const res = await fetch(dataUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to load ${dataUrl}`);
        const items = await res.json();

        if (!Array.isArray(items) || items.length === 0) {
            list.innerHTML = `
        <div class="card border-0 shadow-sm rounded-4">
          <div class="card-body p-4">
            <h2 class="h5 mb-1">No media releases yet</h2>
            <p class="text-muted mb-0">Please check back soon.</p>
          </div>
        </div>`;
            return;
        }

        items.sort(sortByDateDesc);
        list.innerHTML = items.map(mediaCard).join('');

    } catch (err) {
        console.error(err);
        list.innerHTML = `
      <div class="card border-0 shadow-sm rounded-4">
        <div class="card-body p-4">
          <h2 class="h5 mb-1 text-danger">Failed to load media releases</h2>
          <p class="text-muted mb-0">${escapeHtml(String(err.message || err))}</p>
        </div>
      </div>`;
    }
}

document.addEventListener('DOMContentLoaded', renderMedia);
