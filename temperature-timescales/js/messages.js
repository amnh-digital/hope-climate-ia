'use strict';

var Messages = (function() {
  function Messages(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Messages.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.messages = this.opt.content;
    this.domain = this.opt.domain;
    this.maxDomainCount = this.domain[1] - this.domain[0] + 1;
    this.minYearsDisplay = this.opt.minYearsDisplay;

    this.domainCount = -1;
    this.scale = -1;
    this.onScaleChange(this.opt.scale);
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
    message = "<div><p class=\"highlight\">You are viewing <strong>"+years+" "+yearString+"</strong> of global temperature records.</p><p>" + message.text + "</p></div>";
    this.$el.html(message);
  };

  return Messages;

})();
