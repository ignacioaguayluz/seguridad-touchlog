// ==============================
// TouchLog — app.js
// ==============================

// ---- Clock ----
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('live-clock').textContent = `${h}:${m}:${s}`;

  const d = String(now.getDate()).padStart(2, '0');
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  document.getElementById('live-date').textContent = `${d}/${mo}/${y}`;
}
updateClock();
setInterval(updateClock, 1000);

// ---- Toast ----
let toastTimer = null;
function showToast(msg, type = 'ok') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = `toast ${type === 'error' ? 'error' : ''} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('show'); }, 2800);
}

// ---- Scan overlay ----
function playScanEffect(cb) {
  const overlay = document.getElementById('scan-overlay');
  overlay.classList.add('active');
  setTimeout(() => {
    overlay.classList.remove('active');
    if (cb) cb();
  }, 1200);
}

// ---- Render visita ----
function renderVisita(v, prepend = false) {
  const list = document.getElementById('visitas-list');
  const div = document.createElement('div');
  div.className = 'visita-item';
  div.dataset.id = v.id;

  div.innerHTML = `
    <div class="visita-info">
      <div class="visita-nombre">${escHtml(v.nombre)}</div>
      <div class="visita-motivo">${escHtml(v.motivo)}</div>
      ${v.comentario ? `<div class="visita-comentario">${escHtml(v.comentario)}</div>` : ''}
    </div>
    <div class="visita-meta">
      <div class="visita-hora">${escHtml(v.hora)}</div>
      <div class="visita-fecha">${escHtml(v.fecha)}</div>
      <button class="btn-delete" onclick="eliminarVisita(${v.id}, this)" title="Eliminar">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 3h10M5 3V2h4v1M6 6v4M8 6v4M3 3l.7 8h6.6L11 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;

  if (prepend && list.firstChild) {
    list.insertBefore(div, list.firstChild);
  } else {
    list.appendChild(div);
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---- Update badge ----
function updateBadge() {
  const count = document.querySelectorAll('.visita-item').length;
  const badge = document.getElementById('total-badge');
  badge.textContent = `${count} registro${count !== 1 ? 's' : ''}`;

  const footer = document.getElementById('footer-count');
  footer.textContent = `${count} visita${count !== 1 ? 's' : ''} en bitácora`;

  const empty = document.getElementById('empty-state');
  empty.classList.toggle('hidden', count > 0);
}

// ---- Load visitas ----
async function loadVisitas() {
  try {
    const res = await fetch('/api/visitas');
    const data = await res.json();
    const list = document.getElementById('visitas-list');
    list.innerHTML = '';
    data.forEach(v => renderVisita(v, false));
    updateBadge();
  } catch {
    showToast('Error cargando la bitácora', 'error');
  }
}

// ---- Registrar visita ----
async function registrarVisita() {
  const nombre = document.getElementById('nombre').value.trim();
  const motivo = document.getElementById('motivo').value.trim();
  const comentario = document.getElementById('comentario').value.trim();

  if (!nombre) { showToast('El nombre es requerido', 'error'); document.getElementById('nombre').focus(); return; }
  if (!motivo) { showToast('El motivo es requerido', 'error'); document.getElementById('motivo').focus(); return; }

  const btn = document.getElementById('btn-register');
  btn.disabled = true;

  try {
    const res = await fetch('/api/visitas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, motivo, comentario })
    });

    if (!res.ok) { throw new Error(); }
    const nueva = await res.json();

    playScanEffect(() => {
      renderVisita(nueva, true);
      updateBadge();
      // Limpiar form
      document.getElementById('nombre').value = '';
      document.getElementById('motivo').value = '';
      document.getElementById('comentario').value = '';
      showToast('✓ Visita registrada correctamente');
      btn.disabled = false;
    });

  } catch {
    showToast('Error al registrar la visita', 'error');
    btn.disabled = false;
  }
}

// ---- Eliminar visita ----
async function eliminarVisita(id, btn) {
  btn.disabled = true;
  try {
    await fetch(`/api/visitas/${id}`, { method: 'DELETE' });
    const item = document.querySelector(`.visita-item[data-id="${id}"]`);
    if (item) {
      item.style.opacity = '0';
      item.style.transform = 'translateX(20px)';
      item.style.transition = 'all 0.25s ease';
      setTimeout(() => { item.remove(); updateBadge(); }, 250);
    }
  } catch {
    showToast('Error al eliminar', 'error');
    btn.disabled = false;
  }
}

// ---- Enter shortcut ----
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    registrarVisita();
  }
});

// ---- Init ----
loadVisitas();
