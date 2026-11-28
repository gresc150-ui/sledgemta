// ---------- IP másolása ----------
function copyIP() {
  const ipEl = document.getElementById('server-ip');
  const toast = document.getElementById('copy-toast');
  if (!ipEl) return;

  const ip = ipEl.textContent.trim();

  const showToast = () => {
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(ip).then(showToast).catch(() => {});
  } else {
    const t = document.createElement('textarea');
    t.value = ip;
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    document.body.removeChild(t);
    showToast();
  }
}

// ---------- Grafikon ----------
let chartData = [];

function drawChart() {
  const canvas = document.getElementById('playerChart');
  if (!canvas || !canvas.parentElement) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.parentElement.clientWidth;
  const h = 95;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  if (chartData.length < 2) return;

  const pad = 8;
  const max = Math.max(...chartData, 1);
  const min = Math.min(...chartData);
  const range = Math.max(max - min, 1);
  const stepX = (w - pad * 2) / (chartData.length - 1);

  const pts = chartData.map((v, i) => ({
    x: pad + i * stepX,
    y: h - pad - ((v - min) / range) * (h - pad * 2)
  }));

  // Vonal (simított)
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i - 1].x + pts[i].x) / 2;
    ctx.bezierCurveTo(cx, pts[i - 1].y, cx, pts[i].y, pts[i].x, pts[i].y);
  }

  ctx.strokeStyle = '#76ffdc';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Kitöltés a vonal alatt
  ctx.lineTo(pts[pts.length - 1].x, h);
  ctx.lineTo(pts[0].x, h);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(118, 255, 220, 0.30)');
  grad.addColorStop(1, 'rgba(118, 255, 220, 0)');
  ctx.fillStyle = grad;
  ctx.fill();
}

window.addEventListener('resize', drawChart);

// ---------- Szerver státusz ----------
async function frissitStatusz() {
  const pill  = document.getElementById('status-pill');
  const text  = document.getElementById('status-text');
  const count = document.getElementById('player-count');
  const slots = document.getElementById('slots');
  const mode  = document.getElementById('gamemode');

  try {
    const r = await fetch('/api/status', { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const s = await r.json();

    if (!s.online) throw new Error('offline');

    if (pill) {
      pill.classList.add('online');
      pill.classList.remove('offline');
    }
    if (text) text.textContent = 'Online';
    if (count) count.textContent = s.players;
    if (slots) slots.textContent = `${s.players} / ${s.maxplayers} slot`;
    if (s.gamemode && mode) mode.textContent = s.gamemode;

    chartData = Array.isArray(s.history) ? s.history : [];
    drawChart();
  } catch (e) {
    if (pill) {
      pill.classList.remove('online');
      pill.classList.add('offline');
    }
    if (text) text.textContent = 'Offline';
    if (count) count.textContent = '0';
    if (slots) slots.textContent = '– / – slot';
  }
}

frissitStatusz();
setInterval(frissitStatusz, 15000);

// ---------- Hóesés ki/be kapcsoló ----------
function toggleSnow() {
  const snow = document.getElementById('snow-canvas');
  if (!snow) return;
  const hidden = snow.style.display === 'none';
  snow.style.display = hidden ? 'block' : 'none';
  try {
    localStorage.setItem('sledgemta_snow', hidden ? '1' : '0');
  } catch (_) {}
}

(() => {
  try {
    const saved = localStorage.getItem('sledgemta_snow');
    const snow = document.getElementById('snow-canvas');
    if (saved === '0' && snow) snow.style.display = 'none';
  } catch (_) {}
})();

// ---------- Automatikus hóesés minden oldalon ----------
(() => {
  function initSnow() {
    let canvas = document.getElementById('snow-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'snow-canvas';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';
      document.body.appendChild(canvas);
    }

    try {
      const saved = localStorage.getItem('sledgemta_snow');
      if (saved === '0') canvas.style.display = 'none';
    } catch (_) {}

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const flakes = Array.from({ length: 42 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2.1 + 0.8,
      speedY: Math.random() * 0.75 + 0.35,
      speedX: Math.random() * 0.4 - 0.2,
      opacity: Math.random() * 0.48 + 0.22
    }));

    function draw() {
      ctx.clearRect(0, 0, width, height);
      if (canvas.style.display !== 'none') {
        for (const f of flakes) {
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(241, 248, 255, ${f.opacity})`;
          ctx.fill();

          f.y += f.speedY;
          f.x += f.speedX;

          if (f.y > height) {
            f.y = -5;
            f.x = Math.random() * width;
          }
          if (f.x > width) f.x = 0;
          if (f.x < 0) f.x = width;
        }
      }
      requestAnimationFrame(draw);
    }

    draw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSnow);
  } else {
    initSnow();
  }
})();
