'use strict';

var ParticleSleeper = (function() {

  function ParticleSleeper(options) {
    var defaults = {
      "particleCount": 20,
      "color": 0x272a2b,
      "margin": 0.1,
      "radiusRange": [0.05, 0.1],
      "className": "sleeper particle-sleeper",
      "duration": 120,
    };
    options = _.extend({}, defaults, options);
    Sleeper.call(this, options);
  }

  function pseudoRandom(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // inherit from Sleeper
  ParticleSleeper.prototype = Object.create(Sleeper.prototype);
  ParticleSleeper.prototype.constructor = ParticleSleeper;

  ParticleSleeper.prototype.loadData = function(){
    var seed = 1;
    this.particles = _.times(this.opt.particleCount, function(n){
      var rand1 = pseudoRandom(seed); // get a stable pseudo-random number
      var rand2 = pseudoRandom(seed+1);
      var rand3 = pseudoRandom(seed+2);
      var rand4 = pseudoRandom(seed+3);
      seed += 4;
      return {
        "rand1": rand1,
        "rand2": rand2,
        "rand3": rand3,
        "rand4": rand4
      }
    });
    this.refresParticleDimensions();
    this.dataLoaded = true;
  };

  ParticleSleeper.prototype.onResize = function(){
    this.refreshDimensions();
    this.refresParticleDimensions();
    this.app.renderer.resize(this.width, this.height);
  };

  ParticleSleeper.prototype.refresParticleDimensions = function(){
    var w = this.width;
    var h = this.height;
    var radiusRange = this.opt.radiusRange;
    var x0 = h * this.opt.margin;
    var x1 = w - x0;
    var y0 = h;
    var y1 = 0;
    var yStart = [1.0, 0.25]; // start from bottom to x up the screen
    var padding = 0.5 * h;

    this.particles = _.map(this.particles, function(p){
      var rand1 = p.rand1;
      var rand2 = p.rand2;
      var rand3 = p.rand3;
      var rand4 = p.rand4;
      p.x = UTIL.lerp(x0, x1, rand4);
      p.radius = UTIL.lerp(radiusRange[0], radiusRange[1], rand1) * h;
      var pad0 = p.radius + rand2 * padding;
      var pad1 = p.radius + rand3 * padding;
      p.y0 = y0 + pad0;
      p.y1 = y1 - pad1;
      return p;
    });
  };

  ParticleSleeper.prototype.renderGraphics = function(progress, alpha){
    if (!this.dataLoaded) return false;

    // load graphics
    var g = this.graphics;
    var color = this.opt.color;
    g.clear();
    g.beginFill(color);
    _.each(this.particles, function(p){
      var pprogress = (progress + p.rand1) % 1;
      var x = p.x;
      var y = UTIL.lerp(p.y0, p.y1, pprogress);
      // var alpha = pprogress * 2;
      // if (pprogress > 0.5) alpha = (1.0-pprogress) * 2;
      // var lerpedColor = UTIL.lerpColor(0x000000, color, alpha);
      g.drawCircle(x, y, p.radius);
    });
    g.endFill();
  };

  return ParticleSleeper;

})();
