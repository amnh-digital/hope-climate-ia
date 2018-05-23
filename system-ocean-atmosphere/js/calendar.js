'use strict';

var Calendar = (function() {
  function Calendar(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  function lerp(a, b, percent) {
    return (1.0*b - a) * percent + a;
  }

  Calendar.prototype.init = function(){
    this.$el = $(this.opt.el);
  };

  Calendar.prototype.onResize = function(){

  };

  Calendar.prototype.render = function(yearProgress){
    var angle = yearProgress * 360;
    this.$el.css({
      'transform': 'rotate3d(0, 0, 1, '+angle+'deg)'
    });
  };

  return Calendar;

})();
