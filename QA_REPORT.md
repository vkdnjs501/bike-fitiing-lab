# Beta 1.5.0 QA Report

## Static checks

- `node --check app.js`: PASS
- HTML ID duplicates: 0
- JavaScript DOM reference misses: 0
- Legacy 1.1.0 version strings in production files: 0
- Removed experimental 0.860 / 0.900 fit coefficients: confirmed

## Runtime checks — Chromium

PASS scenarios:

1. Manual inseam input → calculation
2. Current → Target → Change dashboard
3. RAISE / LOWER / HOLD verdict logic
4. Purpose switch without changing the 0.883 base target
5. Symptom-check analysis
6. Gallery image load
7. Three-point photo measurement
8. Measurement quality indicator
9. Three-point drag refinement
10. Result JPG generation and download
11. Mobile 390 px responsive layout
12. Camera API fallback path
13. Mock MediaStream camera LIVE path
14. Video frame capture → measurement canvas transition

Browser console errors: 0
Page runtime errors: 0

## Calculation regression sample

- Inseam 800 mm
- Crank 170 mm
- Expected base target: 800 × 0.883 = 706.4 mm
- Displayed target: 706 mm
- Current 690 mm → displayed change: +16 mm

## Code cleanup

- Repeated DOM lookups consolidated into one cached DOM map.
- Fit constants and labels centralized.
- Input recalculation requests coalesced with `requestAnimationFrame`.
- Photo inseam resolution no longer changes status text as a side effect during every save-state check.
- Legacy settings migration retained while using a new 1.5 storage key.
- Photo point rendering, measurement, verdict, adjustment plan and export responsibilities separated into focused functions.
