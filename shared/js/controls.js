'use strict';

var Controls = (function() {
  function Controls(options) {
    var defaults = {};
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  Controls.prototype.init = function(){

    // initialize gamepad state
    var gamepadMappings = this.opt.gamepadMappings;
    var gamepadState = {};
    $.each(_.keys(gamepadMappings), function(key){
      gamepadState[key] = -1;
    });
    this.gamepadState = gamepadState;
    this.gamepadMappings = gamepadMappings;
  };

  Controls.prototype.load = function(){
    this.deferred = $.Deferred();

    switch(this.opt.mode) {
      case "gamepad":
        this.loadGamepad();
        break;
      default:
        this.loadVirtual();
    }

    return this.deferred.promise();
  };

  Controls.prototype.loadGamepad = function(){
    var _this = this;
    var gamepads = navigator.getGamepads();

    if (gamepads && gamepads.length && gamepads[0]) {
      console.log("Gamepad found");
      this.deferred.resolve();
      this.pollGamepad();

    // no gamepad found, keep listening...
    } else {
      requestAnimationFrame(function(){ _this.loadGamepad(); });
    }

  };

  Controls.prototype.loadVirtual = function(){
    // TODO
    var _this = this;
    setTimeout(function(){
      console.log("Controls loaded.");
      _this.deferred.resolve();
    }, 500);
  };

  Controls.prototype.pollGamepad = function(){
    var _this = this;

    var gamepad = navigator.getGamepads()[0];
    if (!gamepad) {
      this.loadGamepad();
      return false;
    }

    var prevState = this.gamepadState;
    var axes = gamepad.axes;
    var gamepadMappings = this.gamepadMappings;

    $.each(gamepadMappings, function(key, index){
      var state = (axes[index] + 1) / 2; // convert from [-1,1] to [0,1]
      state = +state.toFixed(2);
      state = Math.min(state, 1);
      state = Math.max(state, 0);
      // state has changed, execute callback
      if (prevState[key] != state) {
        // console.log("State change", key, state)
        $(document).trigger("gamepad.axes.change", [key, state]);
        _this.gamepadState[key] = state;
      }
    });

    requestAnimationFrame(function(){ _this.pollGamepad(); });
  };

  return Controls;

})();
