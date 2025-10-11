document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('#knowledge-search');
    const filterBar = document.querySelector('#filters');
    const cards = Array.from(document.querySelectorAll('.row.g-4 > [class^="col-"], .row.g-4 > [class*=" col-"]'));
    const loadMoreBtn = document.querySelector('.btn-outline-secondary.btn-sm'); // your Load more button

    let activeFilter = 'all';
    let visibleCount = 6; // number of cards visible at first
    const loadStep = 6;   // how many to load per click

    function text(el, sel) {
        const n = el.querySelector(sel);
        return n ? n.textContent.trim().toLowerCase() : '';
    }

    function cardMatches(card, query, filter) {
        const title = text(card, 'h2');
        const summary = text(card, 'p');
        const badge = text(card, '.badge');
        const hay = `${title} ${summary} ${badge}`;

        const qok = !query || hay.includes(query);
        const fok = (filter === 'all') || (badge.includes(filter));

        return qok && fok;
    }

    function applyFilters() {
        
        const q = (searchInput?.value || '').trim().toLowerCase();

        let count = 0;
        cards.forEach(card => {
            const show = cardMatches(card, q, activeFilter);
            if (show && count < visibleCount) {
                card.classList.remove('d-none');
                count++;
            } else {
                card.classList.add('d-none');
            }
        });

        // Hide Load More if everything visible or no match
        const visibleCards = cards.filter(c => !c.classList.contains('d-none'));
        loadMoreBtn?.classList.toggle('d-none', visibleCards.length === cards.filter(c => cardMatches(c, q, activeFilter)).length);
    }

    // Load More handler
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            visibleCount += loadStep;
            applyFilters();
        });
    }

    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            visibleCount = loadStep; // reset when searching
            applyFilters();
        });
    }

    // Filter buttons
    if (filterBar) {
        filterBar.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            filterBar.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = (btn.dataset.filter || btn.textContent).trim().toLowerCase();
            visibleCount = loadStep;
            applyFilters();
        });
    }

    // Initial display
    applyFilters();
});
