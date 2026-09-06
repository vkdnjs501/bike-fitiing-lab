# QA Report — Bike Fitting Lab Beta 1.6.1

## Scope
Quick Fitting bug fix, crank omission, input validation, PWA cache refresh, and full-fit regression safety.

## Static / syntax validation
- `app.js`: Node syntax check PASS
- `service-worker.js`: Node syntax check PASS
- HTML duplicate IDs: 0
- JavaScript DOM references missing from HTML: 0
- Quick Fitting disables BB input: PASS
- Quick Fitting disables Current Saddle input: PASS
- Quick Fitting disables Crank Length input: PASS
- Quick Fitting crank correction guard: PASS
- Calculate-button click handler: PASS
- Service Worker cache version: `bike-fitting-lab-v1.6.1`
- Versioned `app.js/style.css/manifest/service-worker` loading: PASS

## Calculation regression
Using the production coefficient found in `app.js`:
- Inseam: 800 mm
- Base coefficient: 0.883
- Quick target: 706.4 mm
- Display target: 706 mm
- Crank value during Quick Fitting: ignored

## Error-state UX
When Analog/Quick mode is active without a valid inseam:
- Result state switches to `NEED INSEAM`
- Target remains blank
- Result Dashboard displays a direct inseam-input instruction

## Full-fit regression
Full Fitting mode retains optional crank correction, BB floor reference, Current → Target → Change, symptoms, camera/gallery measurement, and result-photo export.

## Browser-runner note
The local Chromium sandbox in this build environment rejected local/file navigation during automated CDP execution. For this patch, browser interaction claims are therefore not overstated: validation was completed through syntax, DOM contract, event binding, state-guard, cache-version, and calculation regression checks. Final physical iOS Safari interaction should be verified after GitHub Pages deployment.
