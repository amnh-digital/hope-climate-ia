'use strict';

var Map = (function() {
  function Map(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Map.prototype.init = function(){
    this.domain = this.opt.domain;
    this.cities = this.opt.cities;

    this.$el = $(this.opt.el);
    this.$img = $(this.opt.imgEl);
    this.$helper = $(this.opt.helperEl);
    this.$clipImg = $(this.opt.clipImgEl);
    this.$year = $(this.opt.yearEl);
    this.$latitudeUpper = $(this.opt.latUpperEl);
    this.$latitudeLower = $(this.opt.latLowerEl);

    if (ASSET_URL !== undefined) {
      this.opt.dir = ASSET_URL + this.opt.dir;
    }

    var zoneCount = this.opt.zoneData.length;
    this.zoneCount = zoneCount;
    this.degreesPerZone = Math.round(180 / zoneCount);

    this.$helper.css({
      height: (1/zoneCount * 100) + "%",
      display: "block"
    });

    this.preloadImages();
    this.onResize();

    this.loadCities();
    this.onTimeChange(this.opt.time);
    this.onZoneChange(this.opt.zone);
  };

  Map.prototype.loadCities = function(){
    var _this = this;
    var cities = this.cities;
    var $container = $('<div class="cities"></div>');

    _.each(cities, function(city, i){
      var $city = $('<div class="city"><span>'+city.name+'</span></div>');
      $city.css({
        'top': (city.y * 100) + '%',
        'left': (city.x * 100) + '%'
      });
      _this.cities[i].$el = $city;
      $container.append($city);
    });

    this.$el.append($container);
  };

  Map.prototype.onResize = function(){
    this.height = this.$el.height();
    this.helperHeight = this.$helper.outerHeight();
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
    var degreesPerZone = this.degreesPerZone;
    var maxTop = (h - hh) / h * 100;
    var top = zone * maxTop;

    this.$helper.css('top', top + '%');

    var hw = this.helperWidth;
    var y0 = top / 100 * h;
    var y1 = y0 + hh;
    this.$clipImg.css('clip', 'rect('+y0+'px,'+hw+'px,'+y1+'px,0px)');

    var latUpper = Math.round(UTIL.lerp(90, degreesPerZone-90, zone));
    var latLower = latUpper - degreesPerZone;

    var latUpperLabel = "°";
    var latLowerLabel = "°";

    if (latUpper > 0) latUpperLabel += "N";
    else if (latUpper < 0) latUpperLabel += "S";
    if (latLower > 0) latLowerLabel += "N";
    else if (latLower < 0) latLowerLabel += "S";

    this.$latitudeUpper.text(Math.abs(latUpper)+latUpperLabel);
    this.$latitudeLower.text(Math.abs(latLower)+latLowerLabel);

    this.updateCities(value);
  };

  Map.prototype.preloadImages = function(){
    var domain = this.domain;
    // preload images
    for (var year=domain[0]; year<=domain[1]; year++) {
      var img =  new Image();
      img.src = this.opt.dir + 'frame' + year + '.png';
    }
  };

  Map.prototype.updateCities = function(value){
    var zoneCount = this.zoneCount;
    var degrees = 180/zoneCount;
    var degrees0 = value * (180-degrees);
    var degrees1 = degrees0 + degrees;
    var padding = 1;
    var lat0 = 90 - degrees1 + padding;
    var lat1 = 90 - degrees0 - padding;

    _.each(this.cities, function(city){
      if (city.lat > lat0 && city.lat < lat1) {
        city.$el.addClass('active');
      } else {
        city.$el.removeClass('active');
      }
    });
  };

  return Map;

})();
