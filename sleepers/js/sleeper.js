'use strict';

var Sleeper = (function() {
  function Sleeper(options) {
    var defaults = {
      "parent": "#app",
      "role": "subscriber", // or publisher
      "duration": 120,       // in seconds
      "fade": 2, // in seconds
      "position": "left",   // or right
      "channel": "sleeper"
    };
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  Sleeper.prototype.init = function(){
    this.$parent = $(this.opt.parent);
    this.role = this.opt.role;
    this.progress = 0;
    this.durationMs = this.opt.duration * 1000;
    this.fadeMs = this.opt.fade * 1000;
    this.fadePercent = this.fadeMs / this.durationMs;
    this.dataLoaded = false;

    this.offsetX = 0;
    if (this.opt.position === "right") this.offsetX = 0.5;

    this.refreshDimensions();
    this.loadView();
    this.loadData();
    this.loadListeners();
  };

  Sleeper.prototype.loadData = function(){}; // override me

  Sleeper.prototype.loadListeners = function(){
    var _this = this;
    var $document = $(document);

    var onUpdate = function(progress) {
      _this.onUpdate(progress);
    };
    if (this.role === "subscriber") {
      var channel = new Channel(this.opt.channel, {"role": "subscriber"});
      channel.addCallback("sleeper.update", onUpdate);
      channel.listen();
    } else {
      this.channel = new Channel(this.opt.channel, {"role": "publisher"});
    }

    var onSleepStart = function(e, value) {
      _this.onSleepStart();
    };
    var onSleepEnd = function(e, value) {
      _this.onSleepEnd();
    };
    $document.on("sleep.start", onSleepStart);
    $document.on("sleep.end", onSleepEnd);
  };

  Sleeper.prototype.loadView = function(){
    var $el = $('<div class="sleeper '+this.opt.position+'"></div>');
    var app = new PIXI.Application(this.width, this.height, {backgroundColor : 0x000000, antialias: true});
    var graphics = new PIXI.Graphics();

    app.stage.addChild(graphics);
    $el.append(app.view);

    this.app = app;
    this.graphics = graphics;

    this.$parent.prepend($el);
    this.$el = $el;
  };

  Sleeper.prototype.onDataLoaded = function(data){}; // override me

  Sleeper.prototype.onResize = function(){
    this.refreshDimensions();
    this.app.renderer.resize(this.width, this.height);
  };

  Sleeper.prototype.onSleepStart = function(){
    this.active = true;
    this.$el.addClass("active");
    this.render();
  };

  Sleeper.prototype.onSleepEnd = function(){
    this.active = false;
    this.$el.removeClass("active");
  };

  Sleeper.prototype.onUpdate = function(progress){
    this.progress = progress;
  };

  Sleeper.prototype.refreshDimensions = function(){
    var width = this.$parent.width() * 2;
    var height = this.$parent.height();

    this.width = width;
    this.height = height;
  };

  Sleeper.prototype.render = function(){
    if (!this.active && this.role !== "publisher") return false;

    var _this = this;
    var progress = this.progress;

    if (this.role==="publisher") {
      var now = new Date().getTime();
      progress = now % this.durationMs / this.durationMs;
      this.channel.post("sleeper.update", progress);
      this.progress = progress;
    }

    if (this.active) {
      // check if we're fading
      var alpha = 1.0;
      var fadePercent = this.fadePercent;
      if (progress < fadePercent && fadePercent > 0) alpha = progress / fadePercent;
      else if ((1.0-progress) < fadePercent && fadePercent > 0) alpha = (1.0-progress) / fadePercent;

      // render progress
      this.renderGraphics(progress, alpha);
    }

    requestAnimationFrame(function(){ _this.render(); });
  };

  Sleeper.prototype.renderGraphics = function(progress){}; // override me

  return Sleeper;

})();
