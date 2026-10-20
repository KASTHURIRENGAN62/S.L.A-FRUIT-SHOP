# Digital Asset Links

Last verified: 2026-10-20

## Purpose

Android Trusted Web Activity (TWA) builds verify that the app and the website belong to the same owner. The app declares the site, the site publishes `/.well-known/assetlinks.json`, and Android checks the package name and signing-certificate fingerprint.

This repository serves the statement from:

```text
https://YOUR_DOMAIN/.well-known/assetlinks.json
```

## Current file

Location: `.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.slafruitshop.app",
      "sha256_cert_fingerprints": ["REPLACE_WITH_REAL_SHA256_CERTIFICATE_FINGERPRINT"]
    }
  }
]
```

The fingerprint is intentionally a placeholder. Do not fabricate a fingerprint and do not ship this file with the placeholder in place.

## How it is served

`server.js` registers an explicit route before the SPA fallback:

```js
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.type('application/json');
  res.sendFile(path.join(__dirname, '.well-known', 'assetlinks.json'));
});
```

This is required because `express.static` ignores dotfiles by default. Without the explicit route, the request falls through to the SPA/404 handler and Android receives HTML instead of JSON.

The endpoint must:

- return HTTP 200
- return `Content-Type: application/json`
- not redirect, require authentication or return an HTML error page
- be reachable at the exact path `/.well-known/assetlinks.json` (no trailing slash)

## Get the real SHA-256 fingerprint

Use the certificate that signs the installed app, not an unrelated debug certificate.

### Local upload key

After Bubblewrap creates `android.keystore`:

```bash
keytool -list -v -keystore android.keystore -alias android
```

Copy the `SHA256:` value. It is normally colon-separated uppercase hexadecimal, for example `AA:BB:CC:...`.

### Play App Signing

If the app is distributed by Google Play, Play re-signs the AAB with the app-signing key. Use that certificate:

1. Open Play Console.
2. Go to Test and release -> Setup -> App signing.
3. Open App signing key certificate.
4. Copy the SHA-256 certificate fingerprint.

If you install an internal or locally signed build instead, its certificate may be the upload key. You may list both fingerprints in the JSON array:

```json
"sha256_cert_fingerprints": [
  "PLAY_APP_SIGNING_SHA256",
  "UPLOAD_KEY_SHA256"
]
```

Remove any debug fingerprints before production.

## Update and deploy

1. Replace `REPLACE_WITH_REAL_SHA256_CERTIFICATE_FINGERPRINT` with the real value.
2. Confirm `package_name` matches the `applicationId` in `twa-manifest.json` and Play Console.
3. Commit and deploy. No build step is required; Express serves the file directly.
4. Verify the response and Google's parsed statement list.

## Verification

```bash
BASE="https://YOUR_DOMAIN"

curl -sS -D - "$BASE/.well-known/assetlinks.json" -o /tmp/assetlinks.json
cat /tmp/assetlinks.json | jq .

curl -fsS "$BASE/.well-known/assetlinks.json" | jq -e '
  .[0].target.namespace == "android_app" and
  .[0].target.package_name == "com.slafruitshop.app" and
  (.[0].target.sha256_cert_fingerprints[0] | test("^([0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2}$"))
' >/dev/null && echo "assetlinks structure OK"

curl -sS -G "https://digitalassetlinks.googleapis.com/v1/statements:list" \
  --data-urlencode "source.web.site=$BASE" \
  --data-urlencode "relation=delegate_permission/common.handle_all_urls" | jq .
```

The Google API should return the statement with the package name and fingerprint. An empty statement list means the file is missing, unreachable, malformed, or does not match the queried site.

On a device with the app installed:

```bash
adb shell pm get-app-links com.slafruitshop.app
```

The domain should be listed as verified. Opening a shop URL should launch the app without a browser address bar.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| 404 or HTML response | Dotfile ignored by static server or SPA fallback | Keep the explicit Express route before `app.get('*')` |
| 200 but wrong content type | Static file served without JSON type | Use the route's `res.type('application/json')` |
| Redirect to `/` or `/404.html` | Route ordering or host redirect | Ensure the exact path is routed before the catch-all and no host rewrite applies |
| Empty statement list | Fingerprint or package mismatch | Compare Play Console/upload key and `applicationId` exactly |
| Works locally, not in Play | Play App Signing certificate differs from upload key | Add the Play app-signing SHA-256 |
| Works after sideload, fails from Play | Installed build is signed by Google, not your upload key | Use the Play app-signing fingerprint |
| Old result after fixing | Google/device verification cache | Wait and retry; reinstall the app and re-check `pm get-app-links` |
| Duplicate package name | AAB package differs from assetlinks | Regenerate the AAB or update `package_name` to match |

## Security notes

- Never commit `android.keystore`, signing passwords or service credentials.
- The assetlinks file is public by design. It contains only the package name and certificate fingerprint.
- Do not publish placeholder values; Google will reject them and the app will open with browser UI.
