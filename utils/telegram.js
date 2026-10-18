// Admin Telegram notifications via the Telegram Bot API (free, no subscription).
//
// To enable:
//   1. Open Telegram, message @BotFather, send /newbot, follow the prompts.
//      BotFather gives you a token like "123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".
//   2. For EACH person who should get order alerts: open a chat with your new
//      bot and send it any message (e.g. "hi"). A bot can only message users
//      who have messaged it first.
//   3. Find each chat_id by visiting this URL in a browser (after step 2):
//      https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
//      Look for "chat":{"id":XXXXXXXXX, ...} in the JSON response - that
//      number is the chat_id for that person.
//   4. Set in .env:
//      TELEGRAM_BOT_TOKEN - the token from BotFather
//      TELEGRAM_CHAT_ID   - one chat_id, or multiple comma-separated,
//                           e.g. "111111111,222222222"
//
// Telegram is optional: if the env vars aren't set, notifyTelegram() just
// logs the message to the server console and never blocks an order or signup.

const configured = !!process.env.TELEGRAM_BOT_TOKEN;
const https = require('https');

function getRecipients() {
  return String(process.env.TELEGRAM_CHAT_ID || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname,
      method: 'POST',
      family: 4,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout: 15000
    }, (res) => {
      let chunks = '';
      res.on('data', (c) => chunks += c);
      res.on('end', () => {
        try { resolve(JSON.parse(chunks)); }
        catch { reject(new Error('Invalid JSON from Telegram API')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Telegram API request timed out')); });
    req.write(data);
    req.end();
  });
}

async function sendTelegram(text) {
  if (!configured) {
    const err = new Error('Telegram not configured. Set TELEGRAM_BOT_TOKEN in .env.');
    err.code = 'TELEGRAM_NOT_CONFIGURED';
    throw err;
  }

  const recipients = getRecipients();
  if (recipients.length === 0) {
    const err = new Error('TELEGRAM_CHAT_ID is not set in .env.');
    err.code = 'TELEGRAM_NOT_CONFIGURED';
    throw err;
  }

  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  return Promise.all(
    recipients.map(async (chatId) => {
      const data = await httpsPost(url, { chat_id: chatId, text });
      if (!data.ok) {
        const err = new Error(data.description || 'Telegram API error');
        err.code = data.error_code;
        throw err;
      }
      return data;
    })
  );
}

// Fire-and-forget helper. Failures are logged, never thrown, so a notification
// problem can't break an order or signup.
function notifyTelegram(text) {
  return sendTelegram(text)
    .then(() => {
      console.log('[telegram] Admin notification sent.');
    })
    .catch((err) => {
      if (err.code === 'TELEGRAM_NOT_CONFIGURED') {
        console.warn('[telegram] Not configured - skipped admin notification:\n' + text);
        return;
      }
      const code = err.code ? ` [${err.code}]` : '';
      let hint = '';
      if (err.code === 400 || err.code === 403) {
        hint =
          ' (Make sure the person with this chat_id has sent your bot a message first - ' +
          'a bot cannot message someone who has never messaged it.)';
      }
      console.error(`[telegram] Failed to send admin notification${code}:`, err.message + hint);
    });
}

module.exports = { sendTelegram, notifyTelegram, getRecipients };
