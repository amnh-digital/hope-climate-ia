'use strict';

var ColorKey = (function() {
  function ColorKey(options) {
    var defaults = {
      el: '#color-key-canvas'
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  ColorKey.prototype.init = function(){
    var _this = this;
    this.$el = $(this.opt.el);
    this.loadGradient(this.opt.gradient);
  };

  ColorKey.prototype.loadGradient = function(data){
    var canvas = this.$el[0];
    var ctx = canvas.getContext("2d");
    var gradientLen = data.length;
    var w = canvas.width;
    var h = canvas.height;
    var grd = ctx.createLinearGradient(0,0,w,0);
    _.each(data, function(rgb, i){
      var mu = 1.0 * i / (gradientLen-1);
      rgb = _.map(rgb, function(v){
        return Math.round(v*255);
      })
      grd.addColorStop(mu,"rgb("+rgb.join(",")+")");
    });
    ctx.fillStyle=grd;
    ctx.fillRect(0,0,w,h);
  };

  return ColorKey;

})();
