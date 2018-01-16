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

    if (mouseMappings) {
      this.loadMouseListeners(mouseMappings);
    }

    if (keyboardMappings) {
      this.loadKeyboardListeners(keyboardMappings);
    }

    setTimeout(function(){
      console.log("Controls loaded.");
      _this.deferred.resolve();
    }, 10);

    return this.deferred.promise();
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
        $document.trigger("controls.button.down", [keys[key]]);
      }
    };
    var onKeyUp = function(e){
      var key = String.fromCharCode(e.which);
      if (_.indexOf(keys, key) >= 0) {
        state[key] = false;
        $document.trigger("controls.button.up", [keys[key]]);
      }
    };

    $(window).keypress(onKeyDown);
    $(window).keyup(onKeyUp);

  };

  return Controls;

})();
