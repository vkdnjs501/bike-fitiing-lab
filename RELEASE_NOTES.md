# Beta 1.6.5 — PRO Measurement Classification & Dashboard Fix

- Fixed stale QUICK MEASUREMENT exposure during Analog numeric fitting.
- Analog numeric fitting now always resolves to **PRO MEASUREMENT / PRO FIT** after valid input validation.
- Added dedicated PRO verified badge and Professional Measurement Result UI.
- PRO and QUICK modes are now strictly mutually exclusive.
- Result badges use the mode stored with the calculation result to prevent reclassification.
- Updated Service Worker to network-first asset delivery to reduce stale GitHub Pages / iOS PWA code.
- Synchronized HTML, CSS, JS and Service Worker build IDs to `1.6.5-pro-ui1`.
