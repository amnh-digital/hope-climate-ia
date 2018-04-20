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
    this.$marker = $(this.opt.marker);
    this.onResize();
  };

  Calendar.prototype.onResize = function(){
    this.width = this.$el.width();
  };

  Calendar.prototype.render = function(yearProgress){
    var left = this.width * (11.0 / 12.0) * yearProgress;
    this.$marker.css('transform', 'translate3d('+left+'px,0,0)');
  };

  return Calendar;

})();
