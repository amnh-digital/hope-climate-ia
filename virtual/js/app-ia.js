'use strict';

var VirtualAppIA = (function() {

  function VirtualAppIA(config) {
    var defaults = {};
    this.opt = $.extend({}, defaults, config);
    this.init();
  }

  VirtualAppIA.prototype.init = function(){
    
  };

  return VirtualAppIA;

})();

$(function() {
  var app = new VirtualAppIA({});
});
