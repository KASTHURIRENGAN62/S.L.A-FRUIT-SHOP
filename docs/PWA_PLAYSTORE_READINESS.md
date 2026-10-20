# PWA and Play Store Readiness

Last verified: 2026-10-20

## 1. Detected stack

- Node.js v22.23.2, npm 10.9.8
- Express 4 static site + JSON API (`server.js`)
- MongoDB via Mongoose 9, with separate connections for users and orders
- Vanilla HTML/CSS/JavaScript frontend, no bundler and no build step
- `express-session` for the OAuth handshake, JWT for normal authentication
- Optional Twilio WhatsApp, Telegram and SMTP integrations
- PWA assets served directly by Express: `manifest.webmanifest`, `sw.js`, `offline.html`, `icons/`

There is no lint or build script in `package.json`. The detected commands are `npm install`, `npm test` and `npm start`.

## 2. Files created

PWA and store-readiness files:

- `.well-known/assetlinks.json` - Android Digital Asset Links statement (fingerprint placeholder)
- `manifest.webmanifest`
- `sw.js`
- `offline.html`
- `icons/icon-192.png`
- `icons/icon-512.png`
- `icons/icon-512-maskable.png`
- `icons/apple-touch-icon.png`

Account and privacy pages:

- `privacy-policy.html`
- `delete-account.html`
- `routes/account.js`

Tests and documentation:

- `tests/delete-account.test.js`
- `tests/pwa-assets.test.js`
- `docs/PWA_PLAYSTORE_READINESS.md`
- `docs/DIGITAL_ASSET_LINKS.md`

## 3. Files modified

- `server.js` - mounts the account API and adds explicit routes for the privacy policy, account deletion and `/.well-known/assetlinks.json` before the SPA fallback
- `routes/orders.js` - rejects tokens for accounts that no longer exist
- `index.html` - PWA metadata, install button, account-deletion link, footer legal links, nutrition disclaimer
- `css/style.css` - PWA safe areas, install prompt, account menu, legal links, nutrition disclaimer
- `js/main.js` - PWA registration/install prompt, neutral nutrition wording, account menu wiring, removed a dead `/api/fruits` request that always returned 404
- `js/main.min.js` - matching nutrition text and a syntax fix for the previously invalid minified mirror
- `js/i18n.js`, `js/lang/{ta,hi,kn,te,ar}.js` - neutral nutrition wording and translations
- `package.json` - `npm test` script
- `js/main.min.js` is not referenced by `index.html`; it is kept in sync but is not part of the running page

## 4. Local run command

```bash
cp .env.example .env   # first run only; fill in real local values
npm install
npm start
```

Open `http://localhost:3000` (or the port set in `.env`). The local `.env` needs at least `MONGODB_URI`, `ORDERS_MONGODB_URI` and `JWT_SECRET`. `ADMIN_PASSWORD` is needed for the admin console.

For a disposable local database:

```bash
mkdir -p /tmp/sla-mongo
mongod --dbpath /tmp/sla-mongo --port 27018 --bind_ip 127.0.0.1
MONGODB_URI="mongodb://127.0.0.1:27018/sla_test" \
ORDERS_MONGODB_URI="mongodb://127.0.0.1:27018/sla_orders" \
JWT_SECRET="local-test-secret" \
npm start
```

## 5. Test commands

```bash
npm install
npm test
```

`npm test` runs the account-deletion/API tests and the PWA/static-asset tests.

Additional syntax and asset checks:

```bash
node --check sw.js
for f in server.js routes/*.js js/main.js js/i18n.js js/main.min.js js/lang/*.js; do
  node --check "$f"
done
jq empty manifest.webmanifest .well-known/assetlinks.json
identify icons/icon-192.png icons/icon-512.png icons/icon-512-maskable.png icons/apple-touch-icon.png
```

Local route smoke test (server must be running):

```bash
BASE=http://localhost:3000
for path in / /manifest.webmanifest /sw.js /offline.html /privacy-policy /delete-account /.well-known/assetlinks.json /icons/icon-192.png /icons/icon-512.png /icons/icon-512-maskable.png; do
  curl -sS -o /dev/null -w "%{http_code} %{content_type} ${path}\n" "$BASE$path"
done
curl -sS "$BASE/.well-known/assetlinks.json" | jq .
```

## 6. Render build and start commands

- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/`

The service runs `node server.js` and listens on `process.env.PORT`, which Render provides. `CLIENT_URL` must be the public HTTPS origin with no trailing slash, for example `https://s-l-a-fruit-shop.onrender.com`.

Required Render environment variables:

- `MONGODB_URI` - users database
- `ORDERS_MONGODB_URI` - orders database (may be a different database on the same cluster)
- `JWT_SECRET` - long random value
- `ADMIN_PASSWORD` - admin console password
- `CLIENT_URL` - exact public site origin

Optional, only when the feature is enabled:

- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
- `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`
- `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `TWILIO_WHATSAPP_CONTENT_SID`, `ADMIN_WHATSAPP_NUMBER`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`

Set `NODE_VERSION=22` in Render if its default Node version differs. The app was verified on Node 22.23.2.

## 7. Deployment steps

1. Commit and push the repository. Never commit `.env`.
2. In Render, create a Web Service from the repository. If the repository root is a parent folder, set Root Directory to `optimized-frontend-t/frontend`.
3. Set Build Command to `npm install` and Start Command to `npm start`.
4. Add all required environment variables. Use a production MongoDB Atlas cluster and allow Render's outbound connections in Atlas network access.
5. Set `CLIENT_URL` to the final HTTPS origin. Update OAuth callback URLs with the same origin.
6. Deploy and confirm the service is live over HTTPS.
7. Replace the placeholders listed in section 8 before publishing.
8. Run the post-deployment checks in section 11.
9. In Play Console, set the privacy policy URL to `https://YOUR_DOMAIN/privacy-policy` and the account deletion URL to `https://YOUR_DOMAIN/delete-account`.
10. Build and upload the Android App Bundle as described in section 12.

## 8. Remaining placeholders and blockers

- `REPLACE_WITH_REAL_SHA256_CERTIFICATE_FINGERPRINT` in `.well-known/assetlinks.json` - must be replaced with the real SHA-256 certificate fingerprint. Do not invent one.
- `REPLACE_WITH_VERIFIED_BUSINESS_EMAIL` in `privacy-policy.html` and `delete-account.html` - must be replaced with a monitored business email before publishing.
- Confirm that `com.slafruitshop.app` is the final Android application ID. It must match the Play Console app and the AAB.
- Confirm the final public domain and HTTPS certificate. Digital Asset Links must be served from the same site that the app opens.
- If Play App Signing is enabled, the fingerprint must come from the Play Console app-signing certificate, not only the local upload key.
- The site has no rate limiting on sign-in or contact submissions, and `GET /api/contact` is public. These are pre-existing issues outside this PWA change; review before high-traffic launch.

## 9. Privacy details needing confirmation

The privacy policy was written from the code in this repository, but the shop owner must confirm these business and legal details:

- Legal entity or proprietor name, postal address and grievance/contact details
- Verified privacy email and phone number (replace the placeholder)
- Grievance officer or data protection contact required by applicable Indian law
- Hosting provider and region, MongoDB Atlas region, and any international data transfer
- Whether Twilio WhatsApp, Telegram and SMTP email are enabled in production, since the policy describes them conditionally
- Business and accounting retention period for orders, and retention for contact messages
- Backup retention and deletion behaviour at MongoDB Atlas
- Which staff can access the admin console and customer records
- Children's data position (the shop is not directed at children)
- Final Play Store Data safety answers, which must match the policy
- UPI/Net Banking wording: payments are direct UPI transfers or a simulated Net Banking flow; there is no payment gateway and no card data is stored

Do not publish the policy until the placeholder email and these details are confirmed.

## 10. Digital Asset Links

Full instructions, fingerprint commands and troubleshooting are in `docs/DIGITAL_ASSET_LINKS.md`.

The endpoint is:

```text
https://YOUR_DOMAIN/.well-known/assetlinks.json
```

It must return HTTP 200 with `Content-Type: application/json` and must not be intercepted by the SPA fallback. The explicit Express route in `server.js` handles this because `express.static` ignores dotfiles by default.

## 11. Post-deployment verification

```bash
BASE="https://YOUR_DOMAIN"

for path in / /manifest.webmanifest /sw.js /offline.html /privacy-policy /delete-account /.well-known/assetlinks.json /icons/icon-192.png /icons/icon-512.png /icons/icon-512-maskable.png; do
  curl -sS -o /dev/null -w "%{http_code} %{content_type} ${path}\n" "$BASE$path"
done

curl -fsS "$BASE/manifest.webmanifest" | jq .
curl -fsS "$BASE/.well-known/assetlinks.json" | jq .
curl -fsS "$BASE/.well-known/assetlinks.json" | jq -e '.[0].target.package_name == "com.slafruitshop.app"'
curl -fsS "$BASE/sw.js" | node --check -

curl -sS -G "https://digitalassetlinks.googleapis.com/v1/statements:list" \
  --data-urlencode "source.web.site=$BASE" \
  --data-urlencode "relation=delegate_permission/common.handle_all_urls" | jq .
```

Also check in a browser:

- DevTools Application -> Manifest shows no installability errors.
- Application -> Service Workers shows `sw.js` activated with scope `/`.
- Application -> Cache Storage contains only public assets; it must not contain `/api/`, `/admin`, `/delete-account`, `/reset-password` or `/privacy-policy`.
- Console has no errors, no failed requests and no mixed-content warnings.
- The site is usable at 360-390 px width without horizontal scrolling.

## 12. Next Android AAB build steps (Bubblewrap)

1. Install JDK 17 and the Android SDK. These are prerequisites for Bubblewrap.
2. Install Bubblewrap and check the environment:

   ```bash
   npm install -g @bubblewrap/cli
   bubblewrap doctor
   ```

3. Initialise the Android project from the live manifest:

   ```bash
   bubblewrap init --manifest https://YOUR_DOMAIN/manifest.webmanifest
   ```

   Use `com.slafruitshop.app` as the application ID, standalone display mode and portrait orientation. Back up the generated `android.keystore` and its passwords.

4. Build the signed APK and AAB:

   ```bash
   bubblewrap build
   ```

   Expected outputs include `app-release-signed.apk` and `app-release-bundle.aab`.

5. Get the upload-key SHA-256 fingerprint:

   ```bash
   keytool -list -v -keystore android.keystore -alias android | grep "SHA256:"
   ```

6. If Play App Signing is enabled, also copy the SHA-256 from Play Console -> Test and release -> Setup -> App signing -> App signing key certificate.
7. Put the real fingerprint(s) into `.well-known/assetlinks.json`, redeploy and verify with the Google statement list command in section 11. Multiple fingerprints are allowed.
8. Upload `app-release-bundle.aab` to an internal testing track, complete Data safety and content rating, and install from the testing link.
9. Verify link handling on a device:

   ```bash
   adb shell pm get-app-links com.slafruitshop.app
   ```

   The domain should show as verified and the app should open without a browser address bar.

## 13. Readiness conclusion

The PWA layer is ready to deploy, with two mandatory content substitutions: the real certificate fingerprint and the verified business email. The site must be deployed over HTTPS before Play Store verification, and the Play App Signing fingerprint must match the installed build.

No test in this verification run failed.
