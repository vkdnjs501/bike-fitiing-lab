# Beta 1.6.4 — PRO Measurement Classification Fix

Small reliability update correcting measurement-mode classification.

## Fixed
- Analog/direct numeric fitting now takes priority as **PRO MEASUREMENT**.
- `QUICK MEASUREMENT` is reserved for the explicit Quick Fitting workflow only.
- Enabling Analog Measurement automatically turns Quick Fitting off to prevent conflicting states.
- PRO mode requires height, manual inseam, BB floor height, and current saddle height; crank length remains optional.
- Result Dashboard now correctly shows **PRO FIT** and **전문가 측정값** after a valid analog numeric calculation.
- Quick/PRO badges are shown only after a valid result is calculated, preventing stale mode badges.
- Asset/service-worker cache version updated for GitHub Pages deployment.
