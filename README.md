# YEONGDEUNGPO BIKE FITTING LAB — Beta 1.6.2

Field-oriented bicycle saddle-height fitting web app for desktop, iPhone, and iPad.

## Beta 1.6.2 — Quick Measurement Reliability Update

This update fixes the Analog + Quick Fitting workflow and adds real-time input diagnostics for field use.

### Quick workflow
When **Analog Measurement + Quick Fitting** are enabled, the app calculates without camera/gallery/3-point measurement and without BB floor/current saddle/crank inputs.

Required field inputs:
- Rider height (cm)
- Manual inseam (cm)
- Bike type
- Riding purpose

Quick target baseline:
`inseam(mm) × 0.883 + purpose trim`

Purpose trim used only in Quick Fitting:
- COMMUTE: -3 mm
- ENDURANCE: 0 mm
- SPORT: +3 mm

The main output remains **BB center → saddle top**.

### UX changes
- QUICK MEASUREMENT badge appears when Analog Measurement or Quick Fitting is enabled.
- New **USAGE ERROR** panel below REFERENCE shows missing/invalid fields and reasons live in red.
- Rider symptom check is collapsed by default.
- Existing full fitting, camera/gallery measurement, result photo export and iOS/PWA support remain available.

## Deployment
Upload the package contents to the GitHub Pages repository root and replace the previous version files. Upload the `icons/` directory, `manifest.webmanifest`, and `service-worker.js` as well.

The Service Worker cache is bumped to Beta 1.6.2, so the first online launch after deployment refreshes the app shell.

*made by. HyunSeock.Son*
