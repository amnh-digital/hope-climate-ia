'use strict';

var VirtualApp = (function() {

  function VirtualApp(config) {
    var defaults = {};
    this.opt = $.extend({}, defaults, config);
    this.init();
  }

  VirtualApp.prototype.init = function(){
    var pz = panzoom($("#panzoom")[0]);
  };

  return VirtualApp;

})();

$(function() {
  var app = new VirtualApp({});
});
