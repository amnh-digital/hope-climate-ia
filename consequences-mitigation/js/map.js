'use strict';

var Map = (function() {
  function Map(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Map.prototype.init = function(){
    this.$el = $(this.opt.el);
  };

  return Map;

})();
