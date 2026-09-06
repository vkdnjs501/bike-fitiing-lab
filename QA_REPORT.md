# Beta 1.6.6 QA Report

Build: `1.6.6-cm-ui1`

## Runtime regression — PRO Analog
Tested in headless Chromium with the production HTML/CSS/JS loaded as one document.

Inputs:
- Height: 172 cm
- Manual inseam: 80.0 cm
- Analog Measurement: ON
- Bike: MTB
- BB floor height: 30.0 cm
- Current saddle: 70.6 cm
- Crank: 17.0 cm
- Purpose: COMMUTE

Verified output:
- Result state: **PRO FIT**
- PRO MEASUREMENT: visible
- QUICK MEASUREMENT: hidden
- Target: **70.6 cm**
- Current: **70.6 cm**
- Change: **+0.0 cm**
- Inseam: **80.0 cm**
- Crank: **17.0 cm**
- Floor reference: **100.6 cm**
- Usage status: **READY**

## Runtime regression — Quick Fitting
- Analog Measurement: OFF
- Quick Fitting: ON
- Inseam: 80.0 cm
- Purpose: COMMUTE

Verified output:
- Result state: **QUICK FIT**
- Quick target: **70.3 cm**
- QUICK MEASUREMENT: visible
- PRO MEASUREMENT: hidden

## Unit audit
- Visible page text containing the old `mm` unit after runtime load: **0**
- BB/current/crank inputs: cm
- Dashboard, analysis, adjustment plan and result-photo export strings: cm

## Saved-setting migration
Legacy Beta 1.6.5 values are migrated automatically:
- BB 300 → 30.0 cm
- Current 706 → 70.6 cm
- Crank 170 → 17.0 cm

## Static QA
- `app.js` syntax: PASS
- `service-worker.js` syntax: PASS
- `manifest.webmanifest`: PASS
- Duplicate DOM IDs: 0
- Missing JS-referenced DOM IDs: 0
