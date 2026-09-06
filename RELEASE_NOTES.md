# Bike Fitting Lab — Beta 1.6.1
## Quick Fitting Bug Fix

A small stability and field-usability update focused on the Quick Fitting workflow.

### Fixed
- Fixed an issue where the **Quick Fitting calculation button could fail to produce a visible result**.
- Quick Fitting now validates the tape-measured inseam directly and shows a clear input message in the Result Dashboard when a value is missing or invalid.
- Analog Measurement no longer requires rider height for Quick Fitting when a valid inseam measurement is already available.

### Improved
- **Crank Length** is now automatically disabled when Quick Fitting is enabled.
- Quick Fitting now ignores any crank value saved from a previous full fitting session, preventing hidden crank correction from changing the quick result.
- Quick Fitting consistently skips **BB Floor Height / Current Saddle / Crank Length**.
- Added versioned asset loading and Service Worker cache-busting for `app.js`, `style.css`, manifest, and the Service Worker to reduce stale-code issues after GitHub Pages updates.

### Calculation
Quick Fitting remains based on:

`inseam × 0.883 = BB center → saddle top target`

Example: `800 mm × 0.883 = 706.4 mm → 706 mm`

### Version
**Beta 1.6.1 — Quick Fitting Bug Fix**

*made by. HyunSeock.Son*
