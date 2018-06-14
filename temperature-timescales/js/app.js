'use strict';

var AppTimescales = (function() {

  function AppTimescales(config, content, data) {
    var defaults = {};
    this.opt = _.extend({}, defaults, config);
    this.content = content;
    this.data = data;

    this.init();
  }

  AppTimescales.prototype.init = function(){
    var _this = this;

    this.loadControls();
    var soundPromise = this.loadSounds();
    this.$sidebar = $(".sidebar");

    $.when.apply($, [soundPromise]).then(function(){
      _this.onReady();
    });

  };

  AppTimescales.prototype.loadControls = function(){
    var _this = this;

    var controls = new Controls(this.opt.controls);

    return controls.load();
  };

  AppTimescales.prototype.loadListeners = function(){
    var _this = this;
    var $document = $(document);
    var $window = $(window);

    var onAxisChange = function(resp) {
      var key = resp.key;
      var value = resp.value;
      switch(key) {
        case "horizontal":
          _this.onTimeChange(value);
          break;
        case "vertical":
          _this.onScaleChange(1.0-value);
          break;
        default:
          break;
      }
    }
    var channel = new Channel(this.opt.controls.channel, {"role": "subscriber"});
    channel.addCallback("controls.axes.change", onAxisChange);
    channel.listen();

    var onSleepStart = function(e, value) {
      _this.$sidebar.removeClass("active");
      _this.graphics.sleepStart();
    };
    var onSleepEnd = function(e, value) {
      _this.$sidebar.addClass("active");
      _this.graphics.sleepEnd();
    };
    $document.on("sleep.start", onSleepStart);
    $document.on("sleep.end", onSleepEnd);

    var onResize = function(){ _this.onResize(); }
    $window.on('resize', onResize);
  };

  AppTimescales.prototype.loadSounds = function(){
    var _this = this;

    var sound = new Sound(this.opt.sound);

    return sound.load();
  };

  AppTimescales.prototype.onReady = function(){
    var d = this.data;

    var opt = _.extend({}, this.opt.graphics, this.content, this.data);

    // Initialize viz
    this.graphics = new Graphics(opt);

    // Init sleep mode utilitys
    opt = _.extend({}, this.opt.sleep);
    this.sleep = new Sleep(opt);

    // Init messages
    opt = _.extend({}, this.opt.messages, this.content, {domain: this.data.domain, scale: this.opt.graphics.scale, minYearsDisplay: this.opt.graphics.minYearsDisplay});
    this.messages = new Messages(opt);

    this.loadListeners();
    this.render();
  };

  AppTimescales.prototype.onResize = function(){
    this.graphics.onResize();
  };

  AppTimescales.prototype.onScaleChange = function(value) {
    var scale = UTIL.easeInOutSin(value);
    this.graphics.onScaleChange(scale);
    this.messages.onScaleChange(scale);
    this.sleep.wakeUp();
  };

  AppTimescales.prototype.onTimeChange = function(value) {
    this.graphics.onTimeChange(value);
    this.sleep.wakeUp();
  };

  AppTimescales.prototype.render = function(){
    var _this = this;

    this.graphics.render();

    requestAnimationFrame(function(){ _this.render(); });
  };

  return AppTimescales;

})();
