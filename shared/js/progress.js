'use strict';

var Progress = (function() {
  function Progress(options) {
    var defaults = {
      "el": "#progress"
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Progress.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.count = this.opt.count;
    this.loadView();
    this.show(0);
  };

  Progress.prototype.loadView = function(){
    var $container = $('<div />');
    var $dots = [];

    _.times(this.count, function(n){
      var $dot = $('<div class="dot"></div>');
      $container.append($dot);
      $dots.push($dot);
    });

    this.$el.append($container);
    this.$dots = $dots;
  };

  Progress.prototype.show = function(index){
    $('.dot').removeClass("active");
    this.$dots[index].addClass("active");
  };

  return Progress;

})();
