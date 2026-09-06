# Beta 1.5.1 QA Report

## Static checks

- `node --check app.js`: PASS
- `node --check service-worker.js`: PASS
- `manifest.webmanifest` JSON parse: PASS
- HTML duplicate IDs: 0
- JavaScript DOM reference misses: 0
- Required icon files: present
- Apple Touch Icon dimensions: 120 / 152 / 167 / 180 px verified
- PWA icon dimensions: 192 / 512 / 1024 px verified
- Production HTML version string: Beta 1.5.1

## Regression scope

The Beta 1.5 fitting workflow remains unchanged:

1. Manual inseam calculation
2. Current → Target → Change dashboard
3. Bike / riding-purpose selection
4. Symptom analysis
5. Camera / gallery workflow
6. Three-point measurement and drag correction
7. Result-image export

## Beta 1.5.1 platform scope

1. Manifest loading
2. Apple Touch Icon references
3. Favicon references
4. iOS Safari install helper visibility logic
5. Standalone-mode detection
6. Safe-area CSS
7. Mobile numeric input zoom prevention
8. Service-worker registration
9. App-shell cache installation
10. Old Bike Fitting Lab cache cleanup
11. Offline navigation fallback
