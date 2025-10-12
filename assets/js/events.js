async function loadAlbumsData(lang) {
    const res = await fetch('assets/data/events.json', { cache: 'no-store' });
    const raw = await res.json();
    const expanded = raw.map(expandPatternIfNeeded);
    const albums = localizeAlbums(expanded, lang);

    renderEvents(albums, lang);   // thumbs for highlights only
    renderGallery(albums, lang);  // ALWAYS full images (no thumbs)

    // NEW: Jump to #hash AFTER the gallery has been rendered
    if (location.hash) {
        const id = location.hash.slice(1);
        requestAnimationFrame(() => {
            const target = document.getElementById(id);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    if (window.GLightbox) GLightbox({ touchNavigation: true, loop: true });
}

const UI = {
    viewAlbum: { en: "View full album →", id: "Lihat album lengkap →" },
    backToTop: { en: "Back to top", id: "Kembali ke atas" }
};

// Flatten {en,id} objects into strings once
function localizeAlbums(raw, lang) {
    const L = ['title', 'location', 'description'];
    return raw.map(ev => {
        const out = { ...ev };
        for (const k of L) {
            const v = out[k];
            out[k] = (v && typeof v === 'object') ? (v[lang] ?? v.en ?? '') : (v ?? '');
        }
        return out;
    });
}

function expandPatternIfNeeded(ev) {
    if (Array.isArray(ev.images) && ev.images.length) {
        ev.highlights = ev.highlights?.length ? ev.highlights : ev.images.slice(0, 3);
        return ev;
    }
    const pad = Number(ev.pad ?? 3);
    const padder = n => String(n).padStart(pad, '0');
    const ext = (ev.ext || 'webp').toLowerCase();
    const count = Number(ev.count || 0);
    const pattern = ev.pattern || '';
    const files = Array.from({ length: count }, (_, i) => `${pattern}${padder(i + 1)}.${ext}`);

    ev.images = files;

    // Highlights: first N or specific indices
    if (Array.isArray(ev.highlight_indices) && ev.highlight_indices.length) {
        ev.highlights = ev.highlight_indices.map(n => files[n - 1]).filter(Boolean);
    } else {
        const hc = Math.max(1, Math.min(Number(ev.highlights_count || 3), files.length));
        ev.highlights = files.slice(0, hc);
    }

    // Precompute thumb names (events page only)
    if (ev.thumb_suffix) {
        ev._thumbs = files.map(f => addSuffixBeforeExt(f, ev.thumb_suffix));
    }
    return ev;
}

function addSuffixBeforeExt(filename, suffix) {
    const dot = filename.lastIndexOf('.');
    return dot === -1 ? filename + suffix : filename.slice(0, dot) + suffix + filename.slice(dot);
}

function imgTag(src, alt) {
    return `<img src="${src}" class="img-fluid rounded shadow-sm" loading="lazy" alt="${alt}">`;
}

/* ===== Events page renderer (uses thumbs for highlights if present) ===== */
function renderEvents(albums, lang) {
    const el = document.getElementById('events-container');
    if (!el) return;

    el.innerHTML = albums.map(ev => {
        const cards = ev.highlights.map((f, i) => {
            const full = ev.path + f;
            const thumb = ev.thumb_suffix ? (ev.path + addSuffixBeforeExt(f, ev.thumb_suffix)) : full;
            return `
        <div class="col-6 col-md-4">
          <a href="${full}" class="glightbox" data-gallery="${ev.id}" data-title="${ev.title} — Photo ${i + 1}">
            ${imgTag(thumb, `${ev.title} Photo ${i + 1}`)}
          </a>
        </div>`;
        }).join('');

        const sub = [ev.location, ev.date].filter(Boolean).join(' • ');
        const cta = UI.viewAlbum[lang] || UI.viewAlbum.en;

        return `
      <section class="mb-5">
        <h2 class="h5 mb-1">${ev.title}</h2>
        ${sub ? `<p class="text-muted mb-3">${sub}</p>` : ``}
        <div class="row g-3">${cards}</div>
        <div class="mt-3">
          <a href="${lang}/gallery.html#album-${ev.id}" class="btn btn-outline-primary btn-sm">${cta}</a>
        </div>
      </section>`;
    }).join('');
}

/* ===== Gallery page renderer (ALWAYS full images, never thumbs) ===== */
function renderGallery(albums, lang) {
    const el = document.getElementById('gallery-container');
    if (!el) return;

    el.innerHTML = albums.map(ev => {
        const t = ev.title;
        const sub = [ev.location, ev.date].filter(Boolean).join(' • ');

        const items = ev.images.map((f, i) => {
            const full = ev.path + f; // always use full optimized image for gallery
            return `
        <a href="${full}" class="glightbox masonry-item" data-gallery="${ev.id}" data-title="${t} — Photo ${i + 1}">
          <img src="${full}" loading="lazy" alt="${t} Photo ${i + 1}">
        </a>`;
        }).join('');

        return `
      <section id="album-${ev.id}" class="mb-5">
        <div class="d-flex align-items-baseline gap-3 mb-3">
          <h2 class="h5 mb-0">${t}</h2>
          ${sub ? `<span class="text-muted small">${sub}</span>` : ``}
          <a href="#top" class="small ms-auto">${(UI.backToTop[lang] || UI.backToTop.en)}</a>
        </div>

        <div class="masonry">
          ${items}
        </div>
      </section>`;
    }).join('');
}

/* Public init: call from include.js with 'en' or 'id' */
window.initAlbums = function (lang) {
    loadAlbumsData(lang || 'en');
};
