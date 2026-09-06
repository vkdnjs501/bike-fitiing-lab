# Bike Fitting Lab — Beta 1.6.2 QA Report

## Runtime test environment
- Chromium 144 headless runtime via Chrome DevTools Protocol
- Desktop logic regression + 390 px mobile viewport test

## Quick Fitting tests
Using height 175 cm, inseam 80.0 cm, MINI VELO, Analog Measurement ON and Quick Fitting ON:
- COMMUTE => **703 mm**
- ENDURANCE => **706 mm**
- SPORT => **709 mm**
- BB floor/current saddle/crank inputs => disabled
- QUICK MEASUREMENT badge => visible
- USAGE ERROR => READY after valid inputs

## Usage Error test
With Analog Measurement active and height cleared:
- Live Usage Error => `신장`
- Reason => analog mode requires a 100–230 cm direct height input
- Result state => `USAGE ERROR`

## Full fitting regression
Analog OFF / Quick OFF / inseam 80.0 cm / current 690 mm / BB 281 mm / crank 170 mm:
- Target => **706 mm**
- Current => **690 mm**
- Change => **+16 mm**
- Floor reference => **987 mm**

## Mobile UX
390 px viewport:
- Horizontal overflow => **0**
- Rider Check => collapsed by default
- Quick badge => visible in Quick workflow
- Runtime exceptions / console errors => **0**

## Static validation
- app.js syntax: PASS
- service-worker.js syntax: PASS
- manifest JSON parse: PASS
- DOM ID uniqueness/reference checks: PASS
