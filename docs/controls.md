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
