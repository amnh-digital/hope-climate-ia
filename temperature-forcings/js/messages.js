'use strict';

var Messages = (function() {
  function Messages(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Messages.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.forcings = this.opt.forcings;
  };

  Messages.prototype.forcingOff = function(value){

  };

  Messages.prototype.forcingOn = function(value){

  };

  return Messages;

})();
