const { redis } = require('./_redis');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  let s = null, hist = [];
  try { s = JSON.parse(await redis(['GET', 'status']) || 'null'); } catch (e) {}
  try { hist = JSON.parse(await redis(['GET', 'history']) || '[]'); } catch (e) {}

  const online = !!s && Date.now() - s.t < 60000;

  res.status(200).json({
    online,
    players:    online ? s.players : 0,
    maxplayers: online ? s.maxplayers : 0,
    gamemode:   '',
    history:    hist.map(h => h.p),
  });
};