'use strict';

function AppChange(config, content, data) {
  var defaults = {};
  this.opt = _.extend({}, defaults, config);
  this.content = content;
  this.data = data;

  this.init();
}

AppChange.prototype.init = function(){
  var _this = this;

  var controlPromise = this.loadControls();

  $.when.apply($, [controlPromise]).then(function(){
    _this.onReady();
  });
};

AppChange.prototype.loadControls = function(){
  var _this = this;

  var controls = new Controls(this.opt.controls);

  return controls.load();
};

AppChange.prototype.loadListeners = function(){
  var _this = this;
  var $document = $(document);

  var onSlide = function(e, key, value) {
    _this.onSlide(value);
  };
  var onButtonUp = function(e, value) {
    _this.onButtonUp(value);
  };

  $document.on("controls.axes.change", onSlide);
  $document.on("controls.button.up", onButtonUp);

  $(window).on('resize', function(){
    _this.onResize();
  });

};

AppChange.prototype.onButtonUp = function(){
  this.globe.next();
  this.slideshow.next();
};

AppChange.prototype.onReady = function(){
  var d = this.data;

  var opt = _.extend({}, this.opt.slideshow, this.content);

  // Initialize slideshow
  this.slideshow = new Slideshow(opt);

  // Init globe
  opt = _.extend({}, this.opt.globe, this.content, {"geojson": this.data});
  this.globe = new Globe(opt);

  // Init sleep mode utilitys
  opt = _.extend({}, this.opt.sleep);
  this.sleep = new Sleep(opt);

  this.loadListeners();
};

AppChange.prototype.onResize = function(){
  this.globe.onResize();
};

AppChange.prototype.onSlide = function(value) {
  this.slideshow.onSlide(value);
  this.sleep.wakeUp();
};
