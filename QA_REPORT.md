# Bike Fitting Lab Beta 1.6.4 — QA Report

## Focus
PRO/QUICK measurement-state classification fix.

## Runtime validation
Chromium browser DOM/runtime harness, 390 × 844 mobile viewport.

### PRO Analog Numeric flow
Input:
- Height: 175 cm
- Manual inseam: 80.0 cm
- Analog Measurement: ON
- Bike: MINI VELO
- BB floor height: 281 mm
- Current saddle: 700 mm
- Crank: blank (optional)
- Purpose: ENDURANCE

Result:
- Result state: `PRO FIT` — PASS
- `PRO MEASUREMENT` badge visible — PASS
- `QUICK MEASUREMENT` badge hidden — PASS
- Professional measurement result: `706 mm` — PASS
- CURRENT: `700 mm` — PASS
- CHANGE: `+6 mm` — PASS

### Mode conflict regression
- Enabling Analog Measurement automatically clears Quick Fitting — PASS
- Quick Fitting control disabled while Analog Measurement is ON — PASS
- Turning Analog OFF restores Quick Fitting availability — PASS
- Quick Fitting with 80.0 cm inseam + COMMUTE returns `703 mm` — PASS
- Re-entering Analog from Quick clears Quick and restores PRO path — PASS

### UI/runtime
- 390 px viewport horizontal overflow: 0 — PASS
- Browser console errors: 0 — PASS
- Page runtime errors: 0 — PASS

## Static validation
- `node --check app.js` — PASS
- `node --check service-worker.js` — PASS
- Manifest JSON parse — PASS
- DOM id/reference validation — PASS
- ZIP integrity/extraction — PASS
