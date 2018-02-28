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
    this.$marker = $(this.opt.marker);
  };

  Calendar.prototype.render = function(yearProgress){
    this.$el = $(this.opt.el);
    var left = lerp(0, 11.0/12*100, yearProgress);
    this.$marker.css('left', left+'%');
  };

  return Calendar;

})();
