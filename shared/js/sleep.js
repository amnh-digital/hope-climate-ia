'use strict';

var Sleep = (function() {
  function Sleep(options) {
    var defaults = {
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
      $('#app').addClass('sleeping');
    }
  };

  Sleep.prototype.wakeUp = function(){
    if (!this.enabled) return false;

    var now = new Date();
    this.lastActivity = now;
    this.isSleeping = false;
    $('#app').removeClass('sleeping');
  };

  return Sleep;

})();
