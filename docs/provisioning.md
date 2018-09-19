# Provisioning computers running HoPE interactive applications

Once you have [deployed apps](deployment.md) onto a computer, you may want to configure that computer to act like a public-facing kiosk, where uptime and UI/error-free screens are a priority. This document will outline how to do this for a Mac computer.

1. Run [./electron/mac-provisioner.sh](../electron/mac-provisioner.sh) on a Mac machine

   ```
   cd electron
   chmod +x mac-provisioner.sh
   sudo ./mac-provisioner.sh
   ```

   This script will do things like disable updates, bluetooth, and dialog boxes as well as shut down and turn on the computer daily. View the file for details and comment out where necessary.

1. Make the app automatically open on startup. There are two ways of doing this:

   1. The easy way: Go to `System Preferences -> Users & Groups -> Login Items` and add the app

   1. The above way is usually the way to go. However, if the app quits unexpectedly, it will not automatically turn back on. One way to work around this is to create a `.plist` file that runs as a background app, ensuring the Electron app is always on.

      1. Create a `.plist`, e.g. [./electron/plist/com.amnh.hopemac1.plist](../electron/plist/com.amnh.hopemac1.plist), updating the name of the app

      1. Place this file in `~/Library/LaunchAgents/`

      1. Now, every time the computer turns on, this .plist file will run as a background app via [launchd](http://www.launchd.info/) and if the app it is watching unexpectedly quits, it will restart after a few seconds. However, quitting the app using `Command+Q` will not trigger a restart as it's considered a "successful" exit.

1. Ensure app does not freeze. **Note that this is very much a workaround and should only be used as a last resort option if your app continues to freeze and is unable to be fixed**.

   1. Enable the app to emit a "heartbeat". In your Electron config file (e.g. [./electron/hope-mac-2/config.json](../electron/hope-mac-2/config.json)), add a property like:

      ```
      {
        "launchDelay": 15000,
        "heartbeat": 10000,
        "windows": [ ... ],
        ...
      }
      ```

      Which emits a heartbeat every 10 seconds. This will essentially touch a file `~/Library/Application Support/hope-mac-2/heartbeat.txt` every ten seconds.

   1. Create an Applescript file (e.g. [hope-mac-2-checker.scpt](../electron/hope-mac-2-checker.scpt)) on the Mac computer.

   1. Double-click script to open with Script Editor. If necessary, update the app name (e.g. `set myProcess to "hope-mac-2"`) in the script

   1. Export script as app: `File > export`.  In `Where: `, choose `Applications` folder. In `File Format:`, choose `Application`. Select `stay open after run handler`.

   1. Ensure this app runs on startup by going to `System Preferences -> Users & Groups -> Login Items` and add the app

   1. This app will check the heartbeat file (e.g. `~/Library/Application Support/hope-mac-2/heartbeat.txt`) every two minutes. If the file has not been modified since the last check, it will attempt to kill the app and restart the machine.

   1. Note that if you `Command+Q` the main app, you must also `Command+Q` this app checker as well since it will reboot the computer if the main app is not running.
