// Admin WhatsApp notifications via Twilio's WhatsApp API.
// Messages are sent to the number(s) in ADMIN_WHATSAPP_NUMBER (the shop owner).
//
// IMPORTANT (2026): Twilio no longer accepts free-form WhatsApp messages for
// business-initiated conversations. Since April 2025 a message sent outside the
// 24-hour customer-service window MUST use an approved Content Template, sent
// with ContentSid + ContentVariables. Otherwise the API fails with error 21654
// "ContentSid Required" (previously the app sent a plain `body`, which is why
// notifications stopped working).
//
// To enable:
//   1. Create a free Twilio account at https://www.twilio.com
//   2. In the Twilio Console, enable the WhatsApp Sandbox (or better, register
//      a real WhatsApp sender via "WhatsApp Self Sign-up" for production) and
//      get your Account SID + Auth Token.
//   3. Create a Content Template (Console > Messaging > Content Template
//      Builder). A simple `twilio/text` template whose body is just "{{1}}"
//      lets you send the whole notification as variable {{1}}.
//      NOTE: The WhatsApp Sandbox only allows its three pre-approved templates
//      (Appointment Reminders / Order Notifications / Verification Codes), so
//      for arbitrary notification text you must use a real sender, not the
//      sandbox.
//   4. Set in .env:
//      TWILIO_ACCOUNT_SID          - from the Twilio Console dashboard
//      TWILIO_AUTH_TOKEN           - from the Twilio Console dashboard
//      TWILIO_WHATSAPP_FROM        - the Twilio WhatsApp number, e.g. +14155238886
//                                    (sandbox) or your business number (production)
//      TWILIO_WHATSAPP_CONTENT_SID - the HX... SID of the Content Template
//      ADMIN_WHATSAPP_NUMBER       - who to notify. Multiple numbers are allowed as
//                                    a comma-separated list, e.g. "918637407913,
//                                    918270703110"
//
// Sandbox note: each recipient must first opt in by sending the join code from
// the Twilio Console (e.g. "join <code>") to the sandbox number. Once joined,
// messages flow for 72 hours; re-joining refreshes the window.
//
// If TWILIO_WHATSAPP_CONTENT_SID is not set, the app falls back to a plain
// `body` send. That still works inside the 24-hour customer-service window
// (right after the recipient messages the sender), but fails with 21654
// outside it.
//
// WhatsApp is optional: if the env vars aren't set, notifyWhatsApp() just logs
// the message to the server console and never blocks an order or signup.

const configured = !!(
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_WHATSAPP_FROM
);
const countryCode = (process.env.WHATSAPP_COUNTRY_CODE || '91').replace(/^\+/, '');

// Normalizes a number to E.164 without the '+' so the API accepts it: strips
// spaces/dashes, drops a leading 0, and prepends the country code if only 10
// digits are given (e.g. "8270703110" -> "918270703110" for India).
function normalizeNumber(number) {
  let digits = String(number || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) digits = countryCode + digits;
  return digits;
}

function getRecipients() {
  return String(process.env.ADMIN_WHATSAPP_NUMBER || '')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean)
    .map(normalizeNumber)
    .filter(Boolean);
}

// Builds the Twilio Messages.create() payload for one recipient. Prefers the
// Content Template path (ContentSid + ContentVariables, required by WhatsApp
// for business-initiated messages) and falls back to a free-form `body`.
function buildMessageParams(to, text, options = {}) {
  const params = {
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:+${to}`
  };

  const contentSid = options.contentSid || process.env.TWILIO_WHATSAPP_CONTENT_SID;
  if (contentSid) {
    // ContentVariables must be a JSON string; the whole notification goes into
    // {{1}} by default. A custom template whose body is "{{1}}" handles any text.
    params.contentSid = contentSid;
    params.contentVariables = JSON.stringify(options.contentVariables || { 1: text });
  } else {
    params.body = text;
  }
  return params;
}

async function sendWhatsApp(text, options = {}) {
  if (!configured) {
    const err = new Error(
      'WhatsApp not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM in .env.'
    );
    err.code = 'WHATSAPP_NOT_CONFIGURED';
    throw err;
  }

  const recipients = getRecipients();
  if (recipients.length === 0) {
    const err = new Error('ADMIN_WHATSAPP_NUMBER is not set in .env.');
    err.code = 'WHATSAPP_NOT_CONFIGURED';
    throw err;
  }

  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  return Promise.all(recipients.map((to) =>
    client.messages.create(buildMessageParams(to, text, options))
  ));
}

// Fire-and-forget helper. Failures are logged, never thrown, so a notification
// problem can't break an order or signup.
function notifyWhatsApp(text, options) {
  return sendWhatsApp(text, options).catch((err) => {
    if (err.code === 'WHATSAPP_NOT_CONFIGURED') {
      console.warn('[whatsapp] Not configured - skipped admin notification:\n' + text);
      return;
    }

    // Include the Twilio error code (e.g. 21654 ContentSid Required) to make
    // account-level misconfigurations easy to diagnose, plus a hint for the
    // free (Sandbox) setup.
    const code = err.code ? ` [${err.code}]` : '';
    let hint = '';
    if (err.code === 21654 || err.code === 63016) {
      // Outside the 24-hour customer-service window. On the free WhatsApp
      // Sandbox this is fixed by the recipient sending "join <code>" (or any
      // message) to the sandbox number again - that reopens the window.
      hint = ' (Free/Sandbox fix: the admin must re-send "join <sandbox-code>" to ' +
        process.env.TWILIO_WHATSAPP_FROM + ' in WhatsApp to reopen the 24h window. ' +
        'For always-on delivery, set TWILIO_WHATSAPP_CONTENT_SID to an approved template.)';
    } else if (err.code === 21655) {
      hint = ' (TWILIO_WHATSAPP_CONTENT_SID is not valid for this account - copy the ' +
        'HX... SID of one of YOUR account\'s templates from the Twilio Console.)';
    } else if (err.code === 63015) {
      hint = ' (The recipient has not joined your WhatsApp Sandbox - have them send ' +
        '"join <sandbox-code>" to ' + process.env.TWILIO_WHATSAPP_FROM + ' in WhatsApp.)';
    }
    console.error(`[whatsapp] Failed to send admin notification${code}:`, err.message + hint);
  });
}

module.exports = {
  sendWhatsApp,
  notifyWhatsApp,
  normalizeNumber,
  getRecipients,
  buildMessageParams
};
