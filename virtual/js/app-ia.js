'use strict';

var VirtualAppIA = (function() {

  function VirtualAppIA(config) {
    var defaults = {};
    this.opt = $.extend({}, defaults, config);
    this.init();
  }

  function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  }

  VirtualAppIA.prototype.init = function(){
    this.$frame = $("#embedded-page");
    this.loadPage();
  };

  VirtualAppIA.prototype.loadPage = function(){
    var value = getParameterByName("p") || "consequences-change";
    var url = "/"+value+"/index.html?mode=embedded";

    this.$frame.attr("src", url);
    $("."+value).addClass("active");

    $('.app').addClass("page-"+value)
  };

  return VirtualAppIA;

})();

$(function() {
  var app = new VirtualAppIA({});
});
