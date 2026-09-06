# Beta 1.6.5 QA Report

Build: `1.6.5-pro-ui1`

## Target regression scenario
- Height: 172 cm
- Manual inseam: 80.0 cm
- Analog Measurement: ON
- Quick Fitting: forced OFF
- Bike: MTB
- BB floor height: 300 mm
- Current saddle: 706 mm
- Crank: 170 mm
- Purpose: COMMUTE

### Expected / verified
- PRO MEASUREMENT: visible
- QUICK MEASUREMENT: hidden
- Result state: PRO FIT
- Professional measurement result: 706 mm
- Measurement source: ANALOG
- Target: 706 mm

## Mode conflict regression
- Analog OFF + Quick ON -> QUICK FIT only
- Re-enable Analog -> Quick is automatically unchecked and disabled
- Recalculate -> PRO FIT only

## Static QA
- app.js syntax: PASS
- service-worker.js syntax: PASS
- manifest JSON: PASS
- Mobile 390 px horizontal overflow: 0 px
- Browser runtime/page errors: 0

## Deployment hardening
- HTML/CSS/JS/Service Worker build query: `1.6.5-pro-ui1`
- Service Worker cache: `bike-fitting-lab-v1.6.5-pro-ui1`
- App assets use network-first delivery with cache fallback to reduce stale GitHub Pages / iOS PWA code.
