/* ===== gallery.js — Page d'accueil ===== */

let allOeuvres = [];

function formatBadges(comment) {
  const badges = [];
  if (comment && comment.includes('New'))
    badges.push('<span class="badge badge-new">Nouveau</span>');
  if (comment && comment.includes('Collection privée'))
    badges.push('<span class="badge badge-private">Collection privée</span>');
  return badges.join('');
}

function renderCard(o) {
  const badges = formatBadges(o.comment);
  return `
    <a class="card" href="oeuvre.html?id=${o.id}" aria-label="Voir ${o.title}">
      <span class="card-number">N° ${o.id}</span>
      <h2 class="card-title">${o.title}</h2>
      <span class="card-collection">${o.collection}</span>
      <div class="card-meta">
        ${o.date ? `<span class="card-date">${o.date}</span>` : ''}
        ${badges ? `<span class="badges">${badges}</span>` : ''}
      </div>
    </a>`;
}

function renderGallery(oeuvres) {
  const grid = document.getElementById('galleryGrid');
  const info = document.getElementById('resultsInfo');

  if (!oeuvres.length) {
    grid.innerHTML = '<p class="no-results">Aucune œuvre trouvée…</p>';
    info.textContent = '';
    return;
  }

  if (oeuvres.length === allOeuvres.length) {
    info.textContent = `${oeuvres.length} œuvres`;
  } else {
    info.textContent = `${oeuvres.length} œuvre${oeuvres.length > 1 ? 's' : ''} trouvée${oeuvres.length > 1 ? 's' : ''}`;
  }

  grid.innerHTML = oeuvres.map(renderCard).join('');
}

function filterOeuvres(query) {
  const q = query.toLowerCase().trim();
  if (!q) return allOeuvres;
  return allOeuvres.filter(o =>
    o.title.toLowerCase().includes(q) ||
    o.collection.toLowerCase().includes(q)
  );
}

async function init() {
  try {
    const res = await fetch('data/oeuvres.json');
    allOeuvres = await res.json();
    renderGallery(allOeuvres);

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
      renderGallery(filterOeuvres(searchInput.value));
    });
  } catch (err) {
    document.getElementById('galleryGrid').innerHTML =
      '<p class="loading error-msg">Erreur de chargement des œuvres.</p>';
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', init);
