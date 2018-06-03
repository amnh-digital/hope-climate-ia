'use strict';

var Sleeper = (function() {
  function Sleeper(options) {
    var defaults = {
      "el": "#app",
      "role": "subscriber", // or publisher
      "duration": 60,       // in seconds
      "position": "left",   // or right
      "channel": "sleeper"
    };
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  Sleeper.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.role = this.opt.role;
    this.progress = 0;
    this.durationMs = this.opt.duration * 1000;

    this.offsetX = 0;
    if (this.opt.position === "right") this.offsetX = 0.5;

    this.refreshDimensions();
    this.loadView();
    this.loadData();
    this.loadListeners();
  };

  Sleeper.prototype.loadData = function(){
    // override me
  };

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
    var app = new PIXI.Application(this.width, this.height, {backgroundColor : 0x000000, antialias: true});
    var graphics = new PIXI.Graphics();

    app.stage.addChild(graphics);
    this.$el.append(app.view);

    this.app = app;
    this.graphics = graphics;
  };

  Sleeper.prototype.onResize = function(){
    this.refreshDimensions();
    this.app.renderer.resize(this.width, this.height);
  };

  Sleeper.prototype.onSleepStart = function(){
    this.active = true;
    this.render();
  };

  Sleeper.prototype.onSleepEnd = function(){
    this.active = false;
  };

  Sleeper.prototype.onUpdate = function(progress){
    this.progress = progress;
  };

  Sleeper.prototype.refreshDimensions = function(){
    var width = this.$el.width();
    var height = this.$el.height();

    this.width = width;
    this.height = height;
  };

  Sleeper.prototype.render = function(){
    if (!this.active && this.role !== "publisher") return false;

    var _this = this;
    var progress = this.progress;

    if (this.role==="publisher") {
      var now = new Date().getTime();
      progress = now % this.durationMs;
      this.channel.post("particles.update", progress);
    }

    if (this.active) {
      // render progress
      this.renderGraphics(progress);
    }

    requestAnimationFrame(function(){ _this.render(); });
  };

  Sleeper.prototype.renderGraphics = function(progress){
    // override me
  };

  return Sleeper;

})();
