# QA Report — Bike Fitting Lab Beta 1.6.0

## Runtime verification
Executed against Chromium 144 using a DOM/CSS/JavaScript runtime harness.

### Quick field flow
Input:
- Height: 175 cm
- Manual inseam: 800 mm
- Bike: MINI VELO
- Analog Measurement: ON
- Quick Fitting: ON

Expected / actual:
- Target: 706 mm — PASS
- Quick result: `간이 측정값: 706 mm` — PASS
- Result state: QUICK FIT — PASS
- Measure source: ANALOG — PASS
- BB floor reference: SKIP — PASS
- CURRENT: SKIP — PASS
- CHANGE: SKIP — PASS
- Camera disabled — PASS
- Gallery disabled — PASS
- BB floor input disabled — PASS
- Current saddle input disabled — PASS

### Standard-flow regression
With Quick Fitting OFF, BB 281 mm and current saddle 690 mm:
- Target: 706 mm — PASS
- Current: 690 mm — PASS
- Change: +16 mm — PASS
- Floor reference: 987 mm — PASS
- Result state: CALCULATED — PASS

### Mode restoration
- Analog Measurement OFF restores camera/gallery controls — PASS
- Quick Fitting OFF restores BB/current inputs — PASS

### Mobile UI
Viewport: 390 × 844
- Horizontal overflow: none — PASS
- Mode switches fit full mobile width — PASS
- Number inputs remain 16 px to reduce iOS Safari auto-zoom — PASS

## Static verification
- JavaScript syntax errors: 0
- Duplicate DOM IDs: 0
- Missing JavaScript DOM references: 0
- Missing Service Worker shell assets: 0
- Runtime exceptions: 0
- Manifest JSON validation: PASS

## Notes
Physical iPhone/iPad camera hardware and the native iOS share sheet cannot be exercised inside this container runtime. Existing camera/gallery implementation was retained; the new Analog Measurement mode explicitly bypasses those controls when enabled.
