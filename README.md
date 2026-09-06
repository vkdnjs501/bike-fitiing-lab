# YEONGDEUNGPO BIKE FITTING LAB — Beta 1.6.3

Small UX update that separates full analog field measurements from Quick Fitting.

## Measurement states
- **PRO MEASUREMENT**: Analog Measurement ON, Quick Fitting OFF, and valid BB floor height / current saddle / crank values are all present.
- **QUICK MEASUREMENT**: Quick Fitting ON. BB floor height / current saddle / crank are skipped.
- Standard/photo and partial analog workflows remain available without being mislabeled as Quick.

## UI changes
- Adds PRO MEASUREMENT badge and professional result line to the mechanic dashboard.
- Usage Error / input check is collapsed by default and can be expanded manually.
- Failed calculations automatically expand Usage Error so the cause is immediately visible.

## Deploy
Upload all files in this folder to the repository root on GitHub Pages.
