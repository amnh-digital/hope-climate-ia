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
    this.currentMonthIndex = 0;
    this.$el = $(this.opt.el);
    this.loadUI();
    this.onResize();
  };

  Calendar.prototype.loadUI = function(){
    this.$months = $('.calendar-mo');
  };

  Calendar.prototype.onResize = function(){

  };

  Calendar.prototype.render = function(yearProgress){
    var degrees = yearProgress * 360;
    var monthIndex = parseInt(Math.round(yearProgress * 11));
    if (monthIndex !== this.currentMonthIndex) {
      $('.calendar-mo.active').removeClass('active');
      this.$months.eq(monthIndex).addClass('active');
      this.currentMonthIndex = monthIndex;
    }
    this.$el.css({
      'transform': 'rotate3d(0,0,1,'+degrees+'deg)'
    });
  };

  return Calendar;

})();
