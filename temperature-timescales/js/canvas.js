'use strict';

var Canvas = (function() {
  function Canvas(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Canvas.prototype.init = function(){

  };

  Canvas.prototype.onResize = function(){

  };

  Canvas.prototype.onScaleChange = function(value){
    // console.log("scale", value);
  };

  Canvas.prototype.onTimeChange = function(value){
    // console.log("time", value);
  };

  Canvas.prototype.render = function(){

  };

  return Canvas;

})();
