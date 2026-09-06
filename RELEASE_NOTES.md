# Bike Fitting Lab — Beta 1.6.2
## Quick Measurement Reliability & Usage Error Update

- Fixed Analog + Quick Fitting workflow so direct height/inseam inputs calculate normally without photo measurement.
- Quick Fitting now uses rider height + inseam + bike type + riding purpose; BB floor/current saddle/crank remain skipped.
- Added conservative Quick purpose trim: COMMUTE -3 mm / ENDURANCE 0 mm / SPORT +3 mm.
- QUICK MEASUREMENT badge appears when Analog Measurement or Quick Fitting is enabled.
- Added live USAGE ERROR panel under REFERENCE with missing/invalid field and reason in red.
- Rider symptom check is collapsed by default.
- Existing full fitting, photo measurement, result export and iOS/PWA features retained.
