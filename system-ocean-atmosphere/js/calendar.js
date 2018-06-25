'use strict';

var Calendar = (function() {
  function Calendar(options) {
    var defaults = {
      year: 2016
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  function lerp(a, b, percent) {
    return (1.0*b - a) * percent + a;
  }

  Calendar.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.loadUI();
    this.onResize();
  };

  Calendar.prototype.loadUI = function(){
    var year = this.opt.year;
    $('.calendar-mo').each(function(){
      var text = $(this).text();
      $(this).text(text + " " + year)
    });
  };

  Calendar.prototype.onResize = function(){
    this.calendarHeight = this.$el.height();
  };

  Calendar.prototype.render = function(yearProgress){
    var offsetY = yearProgress * this.calendarHeight;
    this.$el.css({
      'transform': 'translate3d(0, -'+offsetY+'px, 0)'
    });
  };

  return Calendar;

})();
