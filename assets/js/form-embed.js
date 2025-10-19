// Reads the URL from window.SITE_CONFIG and injects into any [data-msform]
document.addEventListener('DOMContentLoaded', () => {
    const url = window.SITE_CONFIG?.MS_FORM_EMBED_URL || '';
    document.querySelectorAll('[data-msform]').forEach(holder => {
      if (!url) {
        holder.innerHTML = `<div class="alert alert-warning mb-0">Form URL is not configured.</div>`;
        return;
      }
      holder.innerHTML = `
        <div class="ratio ratio-4x3">
          <iframe src="${url}" title="Contact form"
                  loading="lazy" allowfullscreen style="border:0"
                  referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </div>`;
    });
  });
  