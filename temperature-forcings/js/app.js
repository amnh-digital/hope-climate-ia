'use strict';

var AppForcings = (function() {

  function AppForcings(config, content, data) {
    var defaults = {};
    this.opt = _.extend({}, defaults, config);
    this.content = content;
    this.data = data;

    this.init();
  }

  AppForcings.prototype.init = function(){
    var _this = this;

    var controlPromise = this.loadControls();
    var soundPromise = this.loadSounds();

    $.when.apply($, [controlPromise, soundPromise]).then(function(){
      _this.onReady();
    });
  };

  AppForcings.prototype.loadControls = function(){
    var _this = this;

    var controls = new Controls(this.opt.controls);

    return controls.load();
  };

  AppForcings.prototype.loadListeners = function(){
    var _this = this;
    var $document = $(document);
    var $window = $(window);

    var buttonDown = function(value) {
      _this.onButtonDown(value);
    };
    var buttonUp = function(value) {
      _this.onButtonUp(value);
    };

    var channel = new Channel(this.opt.controls.channel, {"role": "subscriber"});
    channel.addCallback("controls.button.down", buttonDown);
    channel.addCallback("controls.button.up", buttonUp);
    channel.listen();

    var resize = function(){
      _this.onResize();
    };
    $window.on('resize', resize);

    var sleepStart = function(e, value) { _this.graphics.sleepStart(); };
    var sleepEnd = function(e, value) { _this.graphics.sleepEnd(); };
    $document.on("sleep.start", sleepStart);
    $document.on("sleep.end", sleepEnd);
  };

  AppForcings.prototype.loadSounds = function(){
    var _this = this;

    var sound = new Sound(this.opt.sound);

    return sound.load();
  };

  AppForcings.prototype.onReady = function(){
    var d = this.data;

    var opt = _.extend({}, this.opt.graphics, this.data, this.content);

    // Initialize viz
    this.graphics = new Graphics(opt);

    // Init sleep mode utilitys
    opt = _.extend({}, this.opt.sleep);
    this.sleep = new Sleep(opt);

    // Init messages
    opt = _.extend({}, this.opt.messages, this.content);
    this.messages = new Messages(opt);

    this.loadListeners();
    this.render();
  };

  AppForcings.prototype.onResize = function(){
    this.graphics.onResize();
  };

  AppForcings.prototype.onButtonDown = function(value) {
    // console.log("Button down " + value);
    this.graphics.forcingOn(value);
    this.messages.forcingOn(value);
    this.sleep.wakeUp();
  };

  AppForcings.prototype.onButtonUp = function(value) {
    // console.log("Button up " + value);
    this.graphics.forcingOff(value);
    this.messages.forcingOff(value);
    this.sleep.wakeUp();
  };

  AppForcings.prototype.render = function(){
    var _this = this;

    this.graphics.render();

    requestAnimationFrame(function(){ _this.render(); });
  };

  return AppForcings;

})();
