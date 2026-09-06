# YEONGDEUNGPO BIKE FITTING LAB — Beta 1.6.6

Full centimeter UI conversion update.

## Unit policy
- All rider/bike length inputs and dashboard outputs are displayed in **cm**.
- Internal fitting math remains millimeter-based to preserve the existing calculation behavior and precision.
- Existing Beta 1.6.5 saved BB/current/crank values are migrated automatically from mm to cm.

## Examples
- Target 706 mm → **70.6 cm**
- Current saddle 700 mm → **70.0 cm**
- Crank 170 mm → **17.0 cm**
- BB floor height 300 mm → **30.0 cm**
- Quick trim ±3 mm → **±0.3 cm**

PRO / QUICK / photo measurement mode behavior is unchanged from Beta 1.6.5.
