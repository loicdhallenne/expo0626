/* ===== oeuvre.js — Page d'une œuvre ===== */

const WA_NUMBER = '33683889329';
let audio = null;
let isPlaying = false;

// ---- Dimensions ----
function formatSize(size, collection) {
  const parts = size.toUpperCase().split('X');
  if (collection === 'Sculpture' && parts.length === 3) {
    return `${parts[0]} × ${parts[1]} × ${parts[2]} cm`;
  }
  if (parts.length >= 2) return `${parts[0]} × ${parts[1]} cm`;
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

// ---- WhatsApp ----
function buildWhatsAppUrl(message) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

function setupWhatsAppLinks(oeuvre) {
  const isPrivate = oeuvre.comment && oeuvre.comment.includes('Collection privée');
  const priceStr = isPrivate ? '' : (oeuvre.price > 0 ? ` (${oeuvre.price} €)` : '');
  const pageUrl = `https://loicdhallenne.github.io/expo0626/oeuvre.html?id=${oeuvre.id}`;

  const msgLike =
    `❤️ Bonjour Loïc ! Je viens de découvrir "${oeuvre.title}" à l'exposition La Voix Intérieure et cette œuvre me touche vraiment. Bravo pour ce travail !`;

  const msgComment =
    `💬 Bonjour Loïc ! Je viens d'écouter votre récit sur "${oeuvre.title}" à l'exposition La Voix Intérieure. Je voulais vous partager mon ressenti : `;

  const msgReserve =
    `🛒 Bonjour Loïc ! J'ai un vrai coup de cœur pour "${oeuvre.title}"${priceStr} à l'exposition La Voix Intérieure. Je souhaiterais en savoir plus pour la réserver. Pouvez-vous me contacter ? Merci !`;

  document.getElementById('waLike').href    = buildWhatsAppUrl(msgLike);
  document.getElementById('waComment').href = buildWhatsAppUrl(msgComment);

  const reserveBtn = document.getElementById('waReserve');
  if (isPrivate) {
    // Œuvre non disponible — adapter le message
    const msgPrivate = `👋 Bonjour Loïc ! J'ai vu "${oeuvre.title}" à l'exposition La Voix Intérieure. Je sais qu'elle fait partie d'une collection privée, mais je voulais vous faire part de mon admiration pour cette pièce.`;
    reserveBtn.href = buildWhatsAppUrl(msgPrivate);
    reserveBtn.querySelector('strong').textContent = 'Exprimer mon admiration';
    reserveBtn.querySelector('small').textContent  = 'Œuvre en collection privée';
    reserveBtn.style.opacity = '0.75';
  } else {
    reserveBtn.href = buildWhatsAppUrl(msgReserve);
  }
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

  const playBtn       = document.getElementById('playBtn');
  const progressFill  = document.getElementById('progressFill');
  const progressTrack = document.getElementById('progressTrack');
  const currentTimeEl = document.getElementById('currentTime');
  const durationEl    = document.getElementById('durationEl');
  const playerWrapper = document.getElementById('playerWrapper');
  const audioHint     = document.getElementById('audioHint');

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
      audio.play().catch(() => showFallback(audioUrl));
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
      progressFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
      currentTimeEl.textContent = formatTime(audio.currentTime);
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('error', () => showFallback(audioUrl));

  progressTrack.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = progressTrack.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  });
}

function showFallback(audioUrl) {
  const fallbackEl = document.getElementById('audioFallback');
  if (fallbackEl) {
    fallbackEl.innerHTML = `
      <p style="font-size:0.85rem;color:#888;margin-bottom:10px;font-style:italic;">Lecteur alternatif :</p>
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

  document.getElementById('oeuvreNumber').textContent = `Œuvre N° ${oeuvre.id} / 50`;
  document.getElementById('oeuvreTitle').textContent  = oeuvre.title;

  const badgesHtml = formatBadges(oeuvre.comment);
  document.getElementById('oeuvreBADGES').innerHTML =
    badgesHtml ? `<div class="badges">${badgesHtml}</div>` : '';

  const isPrivate = oeuvre.comment && oeuvre.comment.includes('Collection privée');

  document.getElementById('detailCollection').textContent = oeuvre.collection;
  document.getElementById('detailSize').textContent       = formatSize(oeuvre.size, oeuvre.collection);
  document.getElementById('detailDate').textContent       = oeuvre.date || '—';

  const priceEl = document.getElementById('detailPrice');
  if (isPrivate) {
    priceEl.textContent = 'Collection privée';
    priceEl.className   = 'detail-value private-label';
  } else {
    priceEl.textContent = formatPrice(oeuvre.price, oeuvre.comment);
    priceEl.className   = 'detail-value price';
  }

  // Audio
  setupPlayer(oeuvre.audio);

  // WhatsApp
  setupWhatsAppLinks(oeuvre);

  // Navigation
  const { prev, next } = getAdjacentIds(oeuvres, oeuvre.id);
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  prevBtn.href = `oeuvre.html?id=${prev.id}`;
  prevBtn.querySelector('.nav-btn-title').textContent = prev.title;

  nextBtn.href = `oeuvre.html?id=${next.id}`;
  nextBtn.querySelector('.nav-btn-title').textContent = next.title;

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
    const res    = await fetch('data/oeuvres.json');
    const oeuvres = await res.json();
    const oeuvre  = oeuvres.find(o => o.id === id);

    if (!oeuvre) {
      document.getElementById('oeuvreContent').innerHTML =
        '<p class="error-msg">Œuvre introuvable. <a href="index.html">Retour à la galerie</a></p>';
      return;
    }

    document.getElementById('oeuvreContent').style.display = 'block';
    document.getElementById('loadingMsg').style.display    = 'none';
    renderOeuvre(oeuvre, oeuvres);

  } catch (err) {
    document.getElementById('oeuvreContent').innerHTML =
      '<p class="error-msg">Erreur de chargement. <a href="index.html">Retour à la galerie</a></p>';
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', init);
