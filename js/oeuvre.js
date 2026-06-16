/* ===== oeuvre.js — Page d'une œuvre ===== */

let audio = null;
let isPlaying = false;

// ---- Dimensions ----
function formatSize(size, collection) {
  const parts = size.toUpperCase().split('X');
  if (collection === 'Sculpture' && parts.length === 3) {
    return `${parts[0]} × ${parts[1]} × ${parts[2]} cm`;
  }
  if (parts.length >= 2) {
    return `${parts[0]} × ${parts[1]} cm`;
  }
  return size;
}

// ---- Prix ----
function formatPrice(price, comment) {
  if (comment && comment.includes('Collection privée')) return null;
  return price > 0 ? `${price} €` : '—';
}

// ---- Badges ----
function formatBadges(comment) {
  const badges = [];
  if (comment && comment.includes('New'))
    badges.push('<span class="badge badge-new">Nouveau</span>');
  if (comment && comment.includes('Collection privée'))
    badges.push('<span class="badge badge-private">Collection privée</span>');
  return badges.join('');
}

// ---- Navigation cyclique ----
function getAdjacentIds(oeuvres, currentId) {
  const idx = oeuvres.findIndex(o => o.id === currentId);
  const prevIdx = (idx - 1 + oeuvres.length) % oeuvres.length;
  const nextIdx = (idx + 1) % oeuvres.length;
  return { prev: oeuvres[prevIdx], next: oeuvres[nextIdx] };
}

// ---- Audio Player ----
function setupPlayer(audioUrl) {
  audio = new Audio();
  audio.preload = 'none';
  audio.src = audioUrl;

  const playBtn = document.getElementById('playBtn');
  const progressFill = document.getElementById('progressFill');
  const progressTrack = document.getElementById('progressTrack');
  const currentTimeEl = document.getElementById('currentTime');
  const durationEl = document.getElementById('durationEl');
  const playerWrapper = document.getElementById('playerWrapper');
  const audioHint = document.getElementById('audioHint');

  function formatTime(s) {
    if (isNaN(s)) return '--:--';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        console.warn('Lecture impossible:', err);
        showFallback(audioUrl);
      });
    }
  });

  audio.addEventListener('play', () => {
    isPlaying = true;
    playerWrapper.classList.add('playing');
    if (audioHint) audioHint.style.opacity = '0';
  });

  audio.addEventListener('pause', () => {
    isPlaying = false;
    playerWrapper.classList.remove('playing');
  });

  audio.addEventListener('ended', () => {
    isPlaying = false;
    playerWrapper.classList.remove('playing');
    progressFill.style.width = '0%';
    currentTimeEl.textContent = '0:00';
    if (audioHint) audioHint.style.opacity = '1';
  });

  audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
      const pct = (audio.currentTime / audio.duration) * 100;
      progressFill.style.width = pct + '%';
      currentTimeEl.textContent = formatTime(audio.currentTime);
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('error', () => {
    showFallback(audioUrl);
  });

  progressTrack.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = progressTrack.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * audio.duration;
  });
}

function showFallback(audioUrl) {
  const fallbackEl = document.getElementById('audioFallback');
  if (fallbackEl) {
    fallbackEl.innerHTML = `
      <p style="font-size:0.85rem;color:#888;margin-bottom:10px;font-style:italic;">
        Lecteur alternatif :
      </p>
      <audio controls preload="none" style="width:100%;border-radius:10px;">
        <source src="${audioUrl}" type="audio/mp4">
        <source src="${audioUrl}" type="audio/x-m4a">
        Votre navigateur ne supporte pas la lecture audio.
      </audio>`;
    document.getElementById('customPlayer').style.display = 'none';
  }
}

// ---- Render ----
function renderOeuvre(oeuvre, oeuvres) {
  document.title = `${oeuvre.title} — La Voix Intérieure`;

  // Number
  document.getElementById('oeuvreNumber').textContent = `Œuvre N° ${oeuvre.id} / 50`;

  // Title
  document.getElementById('oeuvreTitle').textContent = oeuvre.title;

  // Badges
  const badgesEl = document.getElementById('oeuvreBADGES');
  const badgesHtml = formatBadges(oeuvre.comment);
  badgesEl.innerHTML = badgesHtml ? `<div class="badges">${badgesHtml}</div>` : '';

  // Details
  const priceFormatted = formatPrice(oeuvre.price, oeuvre.comment);
  const isPrivate = oeuvre.comment && oeuvre.comment.includes('Collection privée');

  document.getElementById('detailCollection').textContent = oeuvre.collection;
  document.getElementById('detailSize').textContent = formatSize(oeuvre.size, oeuvre.collection);
  document.getElementById('detailDate').textContent = oeuvre.date || '—';

  const priceEl = document.getElementById('detailPrice');
  if (isPrivate) {
    priceEl.textContent = 'Collection privée';
    priceEl.className = 'detail-value private-label';
  } else {
    priceEl.textContent = priceFormatted;
    priceEl.className = 'detail-value price';
  }

  // Audio
  setupPlayer(oeuvre.audio);

  // Navigation
  const { prev, next } = getAdjacentIds(oeuvres, oeuvre.id);
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  prevBtn.href = `oeuvre.html?id=${prev.id}`;
  prevBtn.querySelector('.nav-btn-title').textContent = prev.title;

  nextBtn.href = `oeuvre.html?id=${next.id}`;
  nextBtn.querySelector('.nav-btn-title').textContent = next.title;

  // Stop audio on navigate
  prevBtn.addEventListener('click', () => { if (audio) audio.pause(); });
  nextBtn.addEventListener('click', () => { if (audio) audio.pause(); });
}

// ---- Init ----
async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'), 10);

  if (!id || isNaN(id)) {
    document.getElementById('oeuvreContent').innerHTML =
      '<p class="error-msg">Œuvre introuvable. <a href="index.html">Retour à la galerie</a></p>';
    return;
  }

  try {
    const res = await fetch('data/oeuvres.json');
    const oeuvres = await res.json();
    const oeuvre = oeuvres.find(o => o.id === id);

    if (!oeuvre) {
      document.getElementById('oeuvreContent').innerHTML =
        '<p class="error-msg">Œuvre introuvable. <a href="index.html">Retour à la galerie</a></p>';
      return;
    }

    document.getElementById('oeuvreContent').style.display = 'block';
    document.getElementById('loadingMsg').style.display = 'none';
    renderOeuvre(oeuvre, oeuvres);

  } catch (err) {
    document.getElementById('oeuvreContent').innerHTML =
      '<p class="error-msg">Erreur de chargement. <a href="index.html">Retour à la galerie</a></p>';
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', init);
