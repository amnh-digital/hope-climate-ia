'use strict';

var Messages = (function() {
  function Messages(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Messages.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.messages = this.opt.messages;
    this.domain = this.opt.domain;
    this.maxDomainCount = this.domain[1] - this.domain[0] + 1;
    this.minYearsDisplay = this.opt.minYearsDisplay;

    this.domainCount = -1;
    this.scale = -1;

    this.loadView();
    this.onScaleChange(this.opt.scale);
  };

  Messages.prototype.loadView = function(){
    var $container = $('<div>');
    $container.html("<h2>You are viewing <strong id=\"yearString\"></strong> of global temperature records.</h2><p id=\"messageString\"></p>");
    this.$el.prepend($container);
    this.$year = $("#yearString");
    this.$message = $("#messageString");
  };

  Messages.prototype.onScaleChange = function(scale){
    if (scale != this.scale) {
      this.scale = scale;
      var minDomainCount = this.minYearsDisplay;
      var maxDomainCount = this.maxDomainCount;
      var domainCount = UTIL.lerp(minDomainCount, maxDomainCount, scale);
      if (domainCount != this.domainCount) {
        this.domainCount = domainCount;
        this.render();
      }
    }
  };

  Messages.prototype.render = function(){
    var years = this.domainCount;
    var message = _.find(this.messages, function(m){
      return years < m.years;
    });
    if (!message) {
      message = this.messages[this.messages.length-1];
    }
    years = Math.round(years);
    var yearString = "year";
    if (years > 1) yearString += "s";

    this.$year.text(years+" "+yearString);
    this.$message.text(message.text);
  };

  return Messages;

})();
