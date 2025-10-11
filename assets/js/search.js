/**
 * search.js
 * Knowledge Hub: live text search + category filters.
 * - Filters: All / Reports / Case Studies / Briefs / Slides (EN & ID labels)
 * - Search over <h2>, <p>, <span> inside each .card
 * - Hides the card's COLUMN so grid reflows
 * - Shows "no results" empty state
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM hooks ---
    const overview = document.querySelector('#overview');
    if (!overview) return;
  
    const searchInput = overview.querySelector('form[role="search"] input');
    const grid        = overview.querySelector('.row.g-4');
    const filterBar   = overview.querySelector('.filter-bar') 
                     || overview.querySelector('.d-flex.flex-wrap.gap-2.mb-4'); // fallback
  
    const cards = Array.from(overview.querySelectorAll('.card'));
    const cols  = cards.map(c => c.closest('[class*="col-"]') || c.parentElement);
  
  
    // --- Normalizers ---
    const norm = s => (s || '').toLowerCase().trim();
  
    // Map any visible button label to a canonical category key
    const mapLabelToCat = (label) => {
      const t = norm(label);
      if (t === 'all' || t === 'semua') return 'all';
      if (t === 'reports' || t === 'report' || t === 'laporan') return 'report';
      if (t.includes('case') || t.includes('studi')) return 'case-study'; // "Case Studies", "Studi Kasus"
      if (t === 'briefs' || t === 'brief' || t === 'ringkasan') return 'brief';
      if (t === 'slides' || t === 'presentasi' || t === 'slide') return 'slide';
      return 'all';
    };
  
    // Extract a canonical category from a card
    const getCategory = (card) => {
      // Preferred: data-category on card or column (if you add later; no HTML change required)
      const data = norm(card.getAttribute('data-category') || (card.closest('[class*="col-"]')?.getAttribute('data-category')));
      if (data) return data;
  
      // Fallback: first .badge text
      const badgeTxt = norm(card.querySelector('.badge')?.textContent);
      if (badgeTxt) {
        if (badgeTxt.includes('report') || badgeTxt.includes('laporan')) return 'report';
        if (badgeTxt.includes('case') || badgeTxt.includes('studi')) return 'case-study';
        if (badgeTxt.includes('brief') || badgeTxt.includes('ringkasan')) return 'brief';
        if (badgeTxt.includes('slide') || badgeTxt.includes('presentasi')) return 'slide';
      }
  
      // Final fallback: look in the title text
      const titleTxt = norm(card.querySelector('h2,h3')?.textContent);
      if (titleTxt) {
        if (titleTxt.includes('case') || titleTxt.includes('studi')) return 'case-study';
        if (titleTxt.includes('brief') || titleTxt.includes('ringkasan')) return 'brief';
        if (titleTxt.includes('slide') || titleTxt.includes('presentasi')) return 'slide';
      }
      return 'other';
    };
  
    // Cache per-card category + searchable text
    const meta = cards.map(card => ({
      cat: getCategory(card),
      text: Array.from(card.querySelectorAll('h2, p, span'))
              .map(n => norm(n.textContent))
              .join(' ')
    }));
  
    let activeCategory = 'all';
  
    // --- Apply filters ---
    let debounce;
    const apply = () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        const q = norm(searchInput?.value);
  
        let shown = 0;
        cards.forEach((card, i) => {
          const matchCat   = (activeCategory === 'all') || (meta[i].cat === activeCategory);
          const matchQuery = !q || meta[i].text.includes(q);
          const show = matchCat && matchQuery;
          cols[i].style.display = show ? '' : 'none';
          if (show) shown++;
        });
  
        if (grid) grid.style.display = shown ? '' : 'none';
      }, 70);
    };
  
    // --- Wire search ---
    searchInput && searchInput.addEventListener('input', apply);
  
    // --- Wire filters (event delegation) ---
    if (filterBar) {
      filterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn');
        if (!btn || !filterBar.contains(btn)) return;
  
        // Visual active state
        filterBar.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
  
        // Category logic
        activeCategory = mapLabelToCat(btn.textContent);
        apply();
      });
    }
  
    // Initial render
    apply();
  });
  