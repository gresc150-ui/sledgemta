// ---------- IP másolása ----------
function copyIP() {
  const ip = document.getElementById('server-ip').textContent.trim();
  const toast = document.getElementById('copy-toast');

  const showToast = () => {
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
  if (!canvas) return;

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

  ctx.strokeStyle = '#3ddc97';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Kitöltés a vonal alatt
  ctx.lineTo(pts[pts.length - 1].x, h);
  ctx.lineTo(pts[0].x, h);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(61, 220, 151, 0.30)');
  grad.addColorStop(1, 'rgba(61, 220, 151, 0)');
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

    pill.classList.add('online');
    pill.classList.remove('offline');
    text.textContent  = 'Online';
    count.textContent = s.players;
    slots.textContent = `${s.players} / ${s.maxplayers} slot`;
    if (s.gamemode && mode) mode.textContent = s.gamemode;

    chartData = Array.isArray(s.history) ? s.history : [];
    drawChart();
  } catch (e) {
    pill.classList.remove('online');
    pill.classList.add('offline');
    text.textContent  = 'Offline';
    count.textContent = '0';
    slots.textContent = '– / – slot';
  }
}

frissitStatusz();
setInterval(frissitStatusz, 15000);
