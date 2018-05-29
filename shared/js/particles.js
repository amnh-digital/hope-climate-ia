'use strict';

var Particles = (function() {
  function Particles(options) {
    var defaults = {
      "el": "#app",
      "role": "subscriber", // or publisher
      "mode": "wind",       // or emissions, cascading
      "duration": 60,       // in seconds
      "position": "left",   // or right
      "particleCount": 100,
      "particleColor": "0x111111",
      "particleRadius": 0.05,
      "channel": "particles"
    };
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  Particles.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.role = this.opt.role;
    this.progress = 0;
    this.durationMs = this.opt.duration * 1000;

    this.offsetX = 0;
    if (this.opt.position === "right") this.offsetX = 0.5;

    this.refreshDimensions();
    this.loadView();
    this.loadParticles();
    this.loadListeners();
  };

  Particles.prototype.loadListeners = function(){
    var _this = this;
    var $document = $(document);

    var onParticleUpdate = function(progress) {
      _this.onParticleUpdate(progress);
    };
    if (this.role === "subscriber") {
      var channel = new Channel(this.opt.channel, {"role": "subscriber"});
      channel.addCallback("particles.update", onParticleUpdate);
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

  Particles.prototype.loadParticles = function(){

  };

  Particles.prototype.loadView = function(){
    var app = new PIXI.Application(this.width, this.height, {backgroundColor : 0x000000, antialias: true});
    var graphics = new PIXI.Graphics();

    app.stage.addChild(graphics);
    this.$el.append(app.view);

    this.app = app;
    this.graphics = graphics;
  };

  Particles.prototype.onParticleUpdate = function(progress){
    this.progress = progress;
  };

  Particles.prototype.onResize = function(){
    this.refreshDimensions();
    this.app.renderer.resize(this.width, this.height);
  };

  Particles.prototype.onSleepStart = function(){
    this.active = true;
    this.render();
  };

  Particles.prototype.onSleepEnd = function(){
    this.active = false;
  };

  Particles.prototype.refreshDimensions = function(){
    var width = this.$el.width();
    var height = this.$el.height();

    this.width = width;
    this.height = height;
    this.particleRadius = this.opt.particleRadius * height;
  };

  Particles.prototype.render = function(){
    if (!this.active && this.role !== "publisher") return false;

    var _this = this;
    var progress = this.progress;

    if (this.role==="publisher") {
      var now = new Date().getTime();
      progress = now % this.durationMs;
      this.channel.post("particles.update", progress);
    }

    if (this.active) {
      if (this.mode === "wind") this.renderWind(progress);
      else if (this.mode === "emissions") this.renderEmissions(progress);
      else this.renderCascading(progress);
    }

    requestAnimationFrame(function(){ _this.render(); });
  };

  return Particles;

})();
