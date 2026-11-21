const { createClient } = require('redis');

let client;

async function getClient() {
  if (!client) {
    client = createClient({ url: process.env.KV_REDIS_URL });
    client.on('error', () => {});
  }
  if (!client.isOpen) await client.connect();
  return client;
}

async function redis(cmd) {
  const c = await getClient();
  return c.sendCommand(cmd);
}

module.exports = { redis };
