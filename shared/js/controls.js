'use strict';

var Controls = (function() {
  function Controls(options) {
    var defaults = {};
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  Controls.prototype.init = function(){};

  Controls.prototype.load = function(){
    this.deferred = $.Deferred();

    var _this = this;
    var mouseMappings = this.opt.mouseMappings;
    var keyboardMappings = this.opt.keyboardMappings;
    var gamepadMappings = this.opt.gamepadMappings;
    var uiMappings = this.opt.uiMappings;

    if (mouseMappings) {
      this.loadMouseListeners(mouseMappings);
    }

    if (keyboardMappings) {
      this.loadKeyboardListeners(keyboardMappings);
    }

    if (uiMappings) {
      this.loadUIListeners(uiMappings);
    }

    if (gamepadMappings) {
      this.loadGamepad(gamepadMappings);

    // don't need to wait for anything if we're not using gamepad controllers
    } else {
      setTimeout(function(){
        console.log("Controls loaded.");
        _this.deferred.resolve();
      }, 10);
    }

    return this.deferred.promise();
  };

  Controls.prototype.loadGamepad = function(gamepadMappings){
    var _this = this;

    var gamepads = navigator.getGamepads();

    if (gamepads && gamepads.length && gamepads[0]) {
      console.log("Gamepad found");
      var gamepadState = {};
      _.each(_.keys(gamepadMappings), function(key){
        gamepadState[key] = -1;
      });

      this.gamepadState = gamepadState;
      this.gamepadMappings = gamepadMappings;
      this.deferred.resolve();
      this.pollGamepad();

    // no gamepad found, keep listening...
    } else {
      requestAnimationFrame(function(){ _this.loadGamepad(gamepadMappings); });
    }

  };

  Controls.prototype.loadMouseListeners = function(mappings){
    var _this = this;

    _.each(mappings, function(options, key){
      if (key==="wheel") _this.loadMouseWheelListeners(options);
      else if (key==="position") _this.loadMousePositionListeners(options);
    });
  };

  Controls.prototype.loadMousePositionListeners = function(opt){
    var axisX = -1;
    var axisY = -1;

    var $document = $(document);
    var $el = $(opt.el);
    var values = opt.values;
    var listenToHorizontal = (values.indexOf("horizontal") >= 0);
    var listenToVertical = (values.indexOf("vertical") >= 0);
    var boundX0 = $el.offset().left;
    var boundY0 = $el.offset().top;
    var boundX1 = boundX0 + $el.width();
    var boundY1 = boundY0 + $el.height();

    // listen for window resize
    var onResize = function(e){
      boundX0 = $el.offset().left;
      boundY0 = $el.offset().top;
      boundX1 = boundX0 + $el.width();
      boundY1 = boundY0 + $el.height();
    };
    $(window).on("resize", onResize);

    var onMousemove = function(e){
      var x = e.pageX;
      var y = e.pageY;
      if (x >= boundX0 && x <= boundX1 && y >= boundY0 && y <= boundY1) {
        if (listenToHorizontal) {
          var newAxisX = (1.0 * x - boundX0) / (boundX1 - boundX0);
          if (newAxisX != axisX) {
            axisX = newAxisX;
            $document.trigger("controls.axes.change", ["horizontal", axisX]);
          }
        }
        if (listenToVertical) {
          var newAxisY = (1.0 * Y - boundY0) / (boundY1 - boundY0);
          if (newAxisY != axisY) {
            axisY = newAxisY;
            $document.trigger("controls.axes.change", ["vertical", axisY]);
          }
        }
      }
    };
    $document.on("mousemove", onMousemove);
  };

  Controls.prototype.loadMouseWheelListeners = function(opt){
    var axisX = 0.5;
    var axisY = 0.5;

    var $document = $(document);
    var $el = $(opt.el);
    var values = opt.values;
    var listenToHorizontal = (values.indexOf("horizontal") >= 0);
    var listenToVertical = (values.indexOf("vertical") >= 0);
    var factor = opt.factor;

    var onMouseWheel = function(e){
      if (listenToHorizontal) {
        var dx = e.deltaX * factor;
        var newAxisX = axisX + dx;
        newAxisX = Math.max(0, newAxisX);
        newAxisX = Math.min(1, newAxisX);
        if (newAxisX != axisX) {
          axisX = newAxisX;
          $document.trigger("controls.axes.change", ["horizontal", axisX]);
        }
      }
      if (listenToVertical) {
        var dy = e.deltaY * factor;
        var newAxisY = axisY + dy;
        newAxisY = Math.max(0, newAxisY);
        newAxisY = Math.min(1, newAxisY);
        if (newAxisY != axisY) {
          axisY = newAxisY;
          $document.trigger("controls.axes.change", ["vertical", axisY]);
        }
      }
    };

    $el.on('mousewheel', onMouseWheel);
  };

  Controls.prototype.loadKeyboardListeners = function(mappings){
    var keys = _.keys(mappings);
    var $document = $(document);
    var state = _.mapObject(mappings, function(val, key) { return false; });

    var onKeyDown = function(e){
      var key = String.fromCharCode(e.which);
      if (_.indexOf(keys, key) >= 0 && !state[key]) {
        state[key] = true;
        $document.trigger("controls.button.down", [mappings[key]]);
      }
    };
    var onKeyUp = function(e){
      var key = String.fromCharCode(e.which);
      if (_.indexOf(keys, key) >= 0) {
        state[key] = false;
        $document.trigger("controls.button.up", [mappings[key]]);
      }
    };

    $(window).keypress(onKeyDown);
    $(window).keyup(onKeyUp);

  };

  Controls.prototype.loadUIListeners = function(mappings) {
    var $container = $('<div id="ui" class="ui"></div>');
    var $document = $(document);

    _.each(mappings, function(opt, key){
      var $slider = $('<div id="'+opt.el+'"></div>');
      $slider.slider(opt.options);
      $slider.on("slide", function(e, ui){
        $document.trigger("controls.axes.change", [key, ui.value]);
      });
      $container.append($slider);
    });

    $('body').append($container);
  };

  Controls.prototype.pollGamepad = function(){
    var _this = this;

    var gamepad = navigator.getGamepads()[0];
    if (!gamepad) {
      this.loadGamepad(this.gamepadMappings);
      return false;
    }

    var prevState = this.gamepadState;
    var axes = gamepad.axes;
    var gamepadMappings = this.gamepadMappings;
    var $document = $(document);

    $.each(gamepadMappings, function(key, index){
      var state = (axes[index] + 1) / 2; // convert from [-1,1] to [0,1]
      state = +state.toFixed(2);
      state = Math.min(state, 1);
      state = Math.max(state, 0);
      // state has changed, execute callback
      if (prevState[key] != state) {
        // console.log("State change", key, state)
        $document.trigger("controls.axes.change", [key, state]);
        _this.gamepadState[key] = state;
      }
    });

    requestAnimationFrame(function(){ _this.pollGamepad(); });
  };

  return Controls;

})();
