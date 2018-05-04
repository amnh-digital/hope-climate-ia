'use strict';

var Controls = (function() {
  function Controls(options) {
    var defaults = {};
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  Controls.prototype.init = function(){
    this.$window = $(window);
    this.$document = $(document);
  };

  Controls.prototype.getGamepadIndex = function(){
    var gamepads = navigator.getGamepads();
    if (!gamepads || !gamepads.length) return false;

    var gamepadIndex = false;
    var count = 5;

    for(var i=0; i<count; i++) {
      if (gamepads[i]) {
        gamepadIndex = i;
        break;
      }
    }

    return gamepadIndex;
  };

  Controls.prototype.load = function(){
    this.deferred = $.Deferred();

    var _this = this;
    var mouseMappings = this.opt.mouseMappings;
    var keyboardMappings = this.opt.keyboardMappings;
    var gamepadMappings = this.opt.gamepadMappings;
    var uiMappings = this.opt.uiMappings;
    var scrollMappings = this.opt.scrollMappings;
    var touchMappings = this.opt.touchMappings;
    var pointerlockMappings = this.opt.pointerlockMappings;

    if (mouseMappings) {
      this.loadMouseListeners(mouseMappings);
    }

    if (keyboardMappings) {
      this.loadKeyboardListeners(keyboardMappings);
    }

    if (uiMappings) {
      this.loadUIListeners(uiMappings);
    }

    if (scrollMappings) {
      this.loadScrollListeners(scrollMappings);
    }

    if (pointerlockMappings) {
      this.loadPointerlockListeners(pointerlockMappings);
    }

    if (touchMappings) {
      this.loadTouchListeners(touchMappings);
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
    var getGamepadIndex = this.getGamepadIndex();

    if (getGamepadIndex !== false) {
      console.log("Gamepad found");
      this.getGamepadIndex = getGamepadIndex;
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

    var $document = this.$document;
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
    this.$window.on("resize", onResize);

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

    var $document = this.$document;
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
    var $document = this.$document;
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

    var $window = this.$window;
    $window.keypress(onKeyDown);
    $window.keyup(onKeyUp);

  };

  Controls.prototype.loadPointerlockListeners = function(mappings){
    var $document = this.$document;
    var el = $(this.opt.el)[0];

    function updatePosition(e){
      _.each(mappings, function(props, orientation){
        var delta = e.movementY;
        if (orientation==="horizontal") delta = event.movementX;
        if (Math.abs(delta) > 0) {
          delta *= props.multiplier;
          $document.trigger("controls."+props.name, [delta]);
        }
      });
    };

    // document.addEventListener("mousemove", updatePosition, false);

    // Initiate pointer lock
    document.addEventListener('pointerlockchange', function(){
      if (document.pointerLockElement === el) {
        console.log('The pointer lock status is now locked');
        document.addEventListener("mousemove", updatePosition, false);
      } else {
        console.log('The pointer lock status is now unlocked');
      }
    }, false);

    el.onclick = function() {
      console.log('Requesting pointer lock...');
      el.requestPointerLock();
    };
  };

  Controls.prototype.loadTouchListeners = function(mappings){
    var $container = $('<div id="ui" class="ui"></div>');
    var $document = this.$document;

    _.each(mappings, function(opt, key){
      var $listener = $('<div id="'+opt.el+'" class="ui-touch-region '+key+'"></div>');
      $container.append($listener);
      var listener = $listener[0];
      var region = new ZingTouch.Region(listener);


      var onChange = function(e){
        var d = e.detail;
        if (d.distanceFromLast) {
          var angle = d.angle;
          var angleDelta = d.distanceFromLast;
          // 90 degrees = starting position = straight up
          angle = 360 - (angle - 90);
          if (angle >= 360) angle -= 360;
          $listener.css('transform', "rotate3d(0, 0, 1, "+angle+"deg)")
          $document.trigger("controls.rotate", [angleDelta]);
        }
      };

      region.bind(listener, key, onChange);
    });

    $('body').append($container);
  };

  Controls.prototype.loadScrollListeners = function(mappings) {
    var $document = this.$document;

    this.$window.on('mousewheel', function(event) {
      // console.log(event.deltaX, event.deltaY, event.deltaFactor);
      _.each(mappings, function(props, orientation){
        var delta = event.deltaY;
        if (orientation==="horizontal") delta = event.deltaX;
        if (Math.abs(delta) > 0) {
          delta *= props.multiplier;
          $document.trigger("controls."+props.name, [-delta]);
        }
      });
    });
  };

  Controls.prototype.loadUIListeners = function(mappings) {
    var $container = $('<div id="ui" class="ui"></div>');
    var $document = this.$document;

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

    var gamepad = navigator.getGamepads()[this.getGamepadIndex];
    if (!gamepad) {
      this.loadGamepad(this.gamepadMappings);
      return false;
    }

    var prevState = this.gamepadState;
    var axes = gamepad.axes;
    var gamepadMappings = this.gamepadMappings;
    var $document = this.$document;

    $.each(gamepadMappings, function(key, index){
      var state = (axes[index] + 1) / 2; // convert from [-1,1] to [0,1]
      state = +state.toFixed(2);
      state = Math.min(state, 1);
      state = Math.max(state, 0);
      var prev = prevState[key];
      // state has changed, execute callback
      if (prev != state) {
        // console.log("State change", key, state)
        // don't trigger if delta is too big
        var delta = Math.abs(prev-state);
        if (delta < 0.25 || prev < 0) {
          $document.trigger("controls.axes.change", [key, state]);
          _this.gamepadState[key] = state;
        }
      }
    });

    requestAnimationFrame(function(){ _this.pollGamepad(); });
  };

  return Controls;

})();
