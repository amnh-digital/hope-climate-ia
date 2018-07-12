'use strict';

var Sleep = (function() {
  function Sleep(options) {
    var defaults = {
      "el": "#app",
      "enable": 1,
      "checkInterval": 10,
      "sleepAfter": 60
    };
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  Sleep.prototype.init = function(){
    this.enabled = this.opt.enable;

    this.lastActivity = new Date();
    this.checkIntervalMs = this.opt.checkInterval * 1000;
    this.sleepAfterMs = this.opt.sleepAfter * 1000;
    this.isSleeping = false;
    this.customVars = this.opt.custom || {};
    this.$el = $(this.opt.el);
    this.$document = $(document);

    this.load();
  };

  Sleep.prototype.load = function(){
    if (!this.enabled) return false;

    var _this = this;
    var checkIntervalMs = this.checkIntervalMs;

    var checkForSleep = function(){
      _this.sleep();
    };

    setInterval(checkForSleep, checkIntervalMs);
  };

  Sleep.prototype.sleep = function(){
    if (!this.enabled || this.isSleeping) return false;

    var now = new Date();
    var elapsed = now - this.lastActivity;
    if (elapsed > this.sleepAfterMs) {
      this.isSleeping = true;
      this.$el.addClass('sleeping');
      this.$document.trigger("sleep.start", [this.customVars]);
    }
  };

  Sleep.prototype.wakeUp = function(){
    if (!this.enabled) return false;

    var now = new Date();
    this.lastActivity = now;
    this.isSleeping = false;
    this.$el.removeClass('sleeping');
    this.$document.trigger("sleep.end", [this.customVars]);
  };

  return Sleep;

})();
