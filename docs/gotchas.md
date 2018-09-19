# HoPE Gotchas

This is a list of technical issues and workarounds encountered during the implementation and installation of these interactive apps.

**Problem: app starts too quickly before dual screen layout initializes**

Solution: add a delay before launching app. This can be configured in the Electron app's `config.json` file.

**Problem: app sometimes loses focus**

Solution Part I: [Robot.js](https://github.com/Robot/robot-js) is used to manually click on the app after launch and whenever app loses focus.

Solution Part II: For dual screens, if each screen has it's own space, focus sometimes switches to the other one. To resolve this, we had to disable this feature (System Preferences > Mission Control > uncheck Displays have separate Spaces.) Then configure the app to be a single window that stretches across the two screens. In this case, two separate apps are embedded as iframes on a single page.

**Problem: app sometimes quits unexpectedly**

Solution: use launchd to restart the app if it unexpectedly quits. See the [provisioning document](provisioning.md) for more details.

**Problem: app occasionally freezes and does not automatically recover/restart**

Solution: add a "heartbeat monitor" to kill an app and restart if app is no longer response. See the [provisioning document](provisioning.md) for more details.

**Problem: physical sliders sometimes have "jitter"**

Solution: a smoothing algorithm was used.  The app would maintain a window of slider events, remove outliers, then do a rolling average on those values in the window. Search **function getSmoothedValue** in this file to see the implementation: [./shared/js/controls.js](../shared/js/controls.js)
