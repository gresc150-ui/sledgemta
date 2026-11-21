const { redis } = require('./_redis');

module.exports = async (req, res) => {
  let b = req.body || {};
  if (typeof b === 'string') b = Object.fromEntries(new URLSearchParams(b));
  const q = req.query || {};

  const key = b.key || q.key;
  if (!process.env.STATUS_SECRET || key !== process.env.STATUS_SECRET) {
    return res.status(403).send('forbidden');
  }

  const players    = parseInt(b.players ?? q.players) || 0;
  const maxplayers = parseInt(b.maxplayers ?? q.maxplayers) || 0;
  const now = Date.now();

  await redis(['SET', 'status', JSON.stringify({ players, maxplayers, t: now })]);

  // Grafikon előzmények: percenként egy pont, max 60
  let hist = [];
  try { hist = JSON.parse((await redis(['GET', 'history'])) || '[]'); } catch (e) {}
  const last = hist[hist.length - 1];
  if (!last || now - last.t >= 60000) {
    hist.push({ t: now, p: players });
    hist = hist.slice(-60);
    await redis(['SET', 'history', JSON.stringify(hist)]);
  }

  res.status(200).send('ok');
};