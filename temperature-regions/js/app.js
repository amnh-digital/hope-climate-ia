'use strict';

function AppRegions(config, content, data) {
  var defaults = {};
  this.opt = _.extend({}, defaults, config);
  this.content = content;
  this.data = data;

  this.init();
}

AppRegions.prototype.init = function(){
  var _this = this;

  var controlPromise = this.loadControls();

  $.when.apply($, [controlPromise]).then(function(){
    _this.onReady();
  });

};

AppRegions.prototype.loadControls = function(){
  var _this = this;

  var controls = new Controls(this.opt.controls);

  return controls.load();
};

AppRegions.prototype.loadListeners = function(){
  var _this = this;

  $(document).on("controls.axes.change", function(e, key, value) {
    switch(key) {
      case "horizontal":
        _this.onTimeChange(value);
        break;
      case "vertical":
        _this.onZoneChange(1.0-value);
        break;
      default:
        break;
    }
  });

  $(window).on('resize', function(){
    _this.onResize();
  });

};

AppRegions.prototype.onReady = function(){
  var d = this.data;

  var opt = _.extend({}, this.opt.graphics, this.data);

  // Initialize viz
  this.graphics = new Graphics(opt);

  opt = _.extend({}, this.opt.map, this.data, this.content, {zone: this.opt.graphics.zone, time: this.opt.graphics.time});
  this.map = new Map(opt);

  // Init sleep mode utilitys
  opt = _.extend({}, this.opt.sleep);
  this.sleep = new Sleep(opt);

  this.loadListeners();
};

AppRegions.prototype.onResize = function(){
  this.graphics.onResize();
  this.map.onResize();
};

AppRegions.prototype.onTimeChange = function(value) {
  this.graphics.onTimeChange(value);
  this.map.onTimeChange(value);
  this.sleep.wakeUp();
};

AppRegions.prototype.onZoneChange = function(value) {
  this.graphics.onZoneChange(value);
  this.map.onZoneChange(value);
  this.sleep.wakeUp();
};
