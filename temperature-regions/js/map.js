'use strict';

var Map = (function() {
  function Map(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Map.prototype.init = function(){
    this.domain = this.opt.domain;

    this.$el = $(this.opt.el);
    this.$img = $(this.opt.imgEl);
    this.$helper = $(this.opt.helperEl);
    this.$clipImg = $(this.opt.clipImgEl);
    this.$year = $(this.opt.yearEl);

    var zoneCount = this.opt.zoneData.length;

    this.$helper.css({
      height: (1/zoneCount * 100) + "%",
      display: "block"
    });

    this.preloadImages();
    this.onResize();

    this.onTimeChange(this.opt.time);
    this.onZoneChange(this.opt.zone);
  };

  Map.prototype.onResize = function(){
    this.height = this.$el.height();
    this.helperHeight = this.$helper.height();
    this.helperWidth = this.$helper.width();
  };

  Map.prototype.onTimeChange = function(value){
    var domain = this.domain;
    var year = Math.round(UTIL.lerp(domain[0], domain[1], value));
    this.$img[0].src = this.opt.dir + 'frame' + year + '.png';
    this.$year.text(year);
  };

  Map.prototype.onZoneChange = function(value){
    var zone = value;
    var h = this.height;
    var hh = this.helperHeight;
    var maxTop = (h - hh) / h * 100;
    var top = zone * maxTop;

    this.$helper.css('top', top + '%');

    var hw = this.helperWidth;
    var y0 = top / 100 * h;
    var y1 = y0 + hh;
    this.$clipImg.css('clip', 'rect('+y0+'px,'+hw+'px,'+y1+'px,0px)');
  };

  Map.prototype.preloadImages = function(){
    var domain = this.domain;
    // preload images
    for (var year=domain[0]; year<=domain[1]; year++) {
      var img =  new Image();
      img.src = this.opt.dir + 'frame' + year + '.png';
    }
  };

  return Map;

})();
