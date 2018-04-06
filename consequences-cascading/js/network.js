'use strict';

var Network = (function() {
  function Network(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Network.prototype.init = function(){
    this.$el = $(this.opt.el);
  };

  Network.prototype.onRotate = function(delta){

  };

  Network.prototype.render = function(0){

  };

  return Network;

})();
