# Using physical controls for HoPE interactive applications

All the interactive apps were designed to be used with physical controls (sliders, knobs, and buttons.) Since the apps are built using web technologies, all the physical control inputs must be emitting events that a web browser (specifically, a Chrome browser) can understand. An [I-PAC interface board](https://www.ultimarc.com/ipacuio.html) is used to connect arbitrary controls to a USB port on the computer.

## Sliders

Sliders are typically configured to act like a gamepad controller, where each slider is mapped to a gamepad controller axis (e.g. up<->down, left<->right), that emits a number between -1 and 1.

The app uses the [Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API) for interfacing with the sliders.

## Knobs/Dials

Knobs/dials are configured to act like a mouse. A single computer can support up to two knobs which can map to the x-movement and y-movement of the mouse.

The app uses the [Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API) to keep the mouse movements hidden to the user as well as constrain their movements to the viewport of the app.

## Buttons

Buttons are very simply mapped to keyboard presses, e.g. `1`, `2`, etc.

## Configuration of controls

Each app has a config file in its directory, e.g.:

```
./consequences-change/
   - config/
      - physical.json
```

The values in this config file is passed into an instance of the controls javascript library ([./shared/js/controls.js](../shared/js/controls.js)) which listens for the appropriate input events and emits [BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) messages that active apps listen to.

If you need a machine-specific configuration file (e.g. if a particular slider needs to be configured manually per machine), you can manually edit the controls.json file in a specific deployment directory, e.g. [./electron/hope-mac-1/controls.json](../electron/hope-mac-1/controls.json).  This will override the default config in `physical.json` shown above. This is particularly useful if, for example, the slider does not slide all the way to the edge or if the slider direction is reversed.

## Slider utility

There is a very basic slider utility for debugging sliders. You can build this by running:

```
sudo npm run build:slider
```

This will create a slider utility app in `./build/mac/slider-utility-darwin-x64/`
