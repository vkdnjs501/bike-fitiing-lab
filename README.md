# YEONGDEUNGPO BIKE FITTING LAB — Beta 1.6.1

Field-oriented bicycle saddle-height fitting web app for desktop, iPhone, and iPad.

## Beta 1.6.1

Small bug-fix update for the Quick Fitting workflow.

### Changes
- Fixed Quick Fitting calculate-button/result update issue.
- Quick Fitting now disables and ignores Crank Length.
- Quick Fitting skips BB Floor Height, Current Saddle Height, and Crank Length.
- Analog + Quick workflow can calculate from a valid tape-measured inseam without requiring height.
- Invalid/missing inseam now produces a visible Result Dashboard message instead of appearing unresponsive.
- Added asset/service-worker cache-busting for GitHub Pages and iOS Home Screen/PWA updates.

### Quick Fitting baseline
`Target saddle height = inseam × 0.883`

The main output is measured from **BB center → saddle top**.

## Deployment
Upload all files and folders in this package to the GitHub Pages repository root, replacing the previous Beta 1.6.0 files.

Because Beta 1.6.1 changes the Service Worker cache version, reload the page after deployment. On an iOS Home Screen installation, closing and reopening the web app after the first online launch helps the new Service Worker take control immediately.

*made by. HyunSeock.Son*
