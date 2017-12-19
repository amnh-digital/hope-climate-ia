'use strict';

function App(options) {
  var defaults = {};
  this.opt = _.extend({}, defaults, options);
  this.init();
}

App.prototype.init = function(){
  var _this = this;

  var dataPromise = this.loadData();
  var controlPromise = this.loadControls();
  var soundPromise = this.loadSounds();

  $.when.apply($, [dataPromise, controlPromise, soundPromise]).then(function(){
    _this.onReady();
  });

};

App.prototype.loadControls = function(){
  var _this = this;

  var controls = new Controls(this.opt.controls);

  return controls.load();
};

App.prototype.loadData = function(){
  var _this = this;

  return $.getJSON(this.opt.dataURL, function(data) {
    console.log('Data loaded.');
    _this.onDataLoaded(data);
  });
};

App.prototype.loadListeners = function(){
  var _this = this;

  $(document).on("controls.axes.change", function(e, key, value) {
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
  });

  $(window).on('resize', function(){
    _this.onResize();
  });

};

App.prototype.loadSounds = function(){
  var _this = this;

  var sound = new Sound(this.opt.sound);

  return sound.load();
};

App.prototype.onDataLoaded = function(d){
  this.data = d;
};

App.prototype.onReady = function(){
  var d = this.data;

  var opt = _.extend({}, this.opt.graphics, this.data);

  // Initialize viz
  this.graphics = new Graphics(opt);

  this.loadListeners();
  this.render();
};

App.prototype.onResize = function(){
  this.graphics.onResize();
};

App.prototype.onScaleChange = function(value) {
  var scale = UTIL.easeInOutSin(value);
  this.graphics.onScaleChange(scale);
};

App.prototype.onTimeChange = function(value) {
  this.graphics.onTimeChange(value);
};

App.prototype.render = function(){
  var _this = this;

  this.graphics.render();

  requestAnimationFrame(function(){ _this.render(); });
};
