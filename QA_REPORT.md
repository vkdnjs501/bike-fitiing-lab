# Bike Fitting Lab Beta 1.6.3 — QA Report

## Scope
Professional analog measurement classification and collapsible Usage Error UX.

## Runtime checks
- Analog ON + Quick OFF + Height 175 cm + Inseam 80.0 cm + MINI VELO + BB 281 mm + Current 700 mm + Crank 170 mm
  - Result state: `PRO FIT` — PASS
  - `PRO MEASUREMENT` visible — PASS
  - `QUICK MEASUREMENT` hidden — PASS
  - Target: `706 mm` — PASS
  - Professional result line: `전문가 측정값: 706 mm` — PASS
- Quick Fitting ON with same rider inputs
  - Result state: `QUICK FIT` — PASS
  - Quick badge visible / Pro badge hidden — PASS
  - COMMUTE quick target: `703 mm` — PASS
- Missing required analog height + Calculate
  - Result state: `USAGE ERROR` — PASS
  - Usage Error panel automatically expands — PASS
  - Missing height reason shown — PASS

## UI checks
- Usage Error details panel is collapsed by default — PASS
- Mobile viewport 390 px: document scroll width = 390 px — PASS
- Horizontal overflow — NONE

## Static checks
- JavaScript syntax (`node --check`) — PASS
- Missing JS-referenced DOM IDs — 0
- Duplicate DOM IDs — 0
- Service Worker cache version updated to `v1.6.3-pro1`
