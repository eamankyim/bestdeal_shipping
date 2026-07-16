# Mobile distribution checklist

Target: **iOS Unlisted App Store** + **Android APK** (internal link) via EAS.

Production API (already set in `src/config/api.js`): `https://bestdealshippingapp.com/api`

EAS project: [@eamankyim/bestdeal-shipping](https://expo.dev/accounts/eamankyim/projects/bestdeal-shipping)  
`extra.eas.projectId` is already set in `app.json`.

ASC / store URLs (use these in App Store Connect):

- Privacy: `https://bestdealshippingapp.com/privacy`
- Support: `https://bestdealshippingapp.com/support`
- Support email: `support@icreationsglobal.com`

---

## Done by agent

- Production API pointed at `https://bestdealshippingapp.com/api`
- EAS project linked; `eas.json` profiles for iOS production + Android APK preview/production
- `app.json`: bundle ids, buildNumber, versionCode, projectId, permission strings
- Frontend pages: `/privacy` and `/support` (React Router public routes)
- `STORE_METADATA` in `src/config/constants.js` set to the production URLs above
- `eas.json` submit production profile has **no** `ascAppId` (placeholder removed) so `eas submit` prompts you to pick the ASC app interactively
- Non-interactive EAS checks only (`eas whoami` / project validation) — **no** `eas build` / `eas submit` started (Apple login / 2FA must be done by you)

---

## You must do (ordered)

1. **Deploy frontend to Contabo** so `/privacy` and `/support` are live on `bestdealshippingapp.com`  
   On the server (production branch, clean tree): run `./deploy-production.sh` from the repo root (fast-forward pull + rebuild/restart containers). Or merge/push to `production` if you use the GitHub Actions deploy workflow.
2. **Verify** in a browser: both URLs return the pages (not the SPA catch-all / login).
3. **Create the app in App Store Connect** (bundle id `com.bestdeal.shipping`), complete agreements / paid apps if prompted.
4. **Fill App Store Connect metadata** with Privacy + Support URLs above; complete age rating, encryption export, screenshots, etc.
5. **Approve / provide Apple credentials** when EAS asks (`eas credentials` or first build) — includes any 2FA.
6. **Build & submit iOS** (from `mobile/`):

   ```bash
   eas build --platform ios --profile production
   eas submit --platform ios --profile production
   ```

   Submit will ask you to select the app. Optional later: set `submit.production.ios.ascAppId` in `eas.json` to the numeric **Apple ID** from ASC → your app → **App Information** (digits only, ≤30 chars) to skip the prompt.
7. After first **Public** approval, request **Unlisted** distribution in ASC and share the Unlisted link.
8. **Android APK** (internal): `eas build --platform android --profile preview` — download APK from Expo and distribute the file/link (no Play Store required for this path).

---

## Ordered flow: Unlisted iOS (summary)

1. Create ASC app as **Public** (Unlisted is requested after first approval)
2. Build → submit (TestFlight optional) → App Review
3. After approval, request **Unlisted** in ASC
4. Share the Unlisted App Store link

Do not start a paid iOS build until Apple credentials work non-interactively (or you can complete 2FA) and privacy URLs are live.
