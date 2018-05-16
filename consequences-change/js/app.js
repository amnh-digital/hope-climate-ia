'use strict';

var AppChange = (function() {

  function AppChange(config, content, data) {
    var defaults = {};
    this.opt = _.extend({}, defaults, config);
    this.content = content;
    this.data = data;

    this.init();
  }

  AppChange.prototype.init = function(){
    var _this = this;

    this.onReady();
    this.loadListeners();
    this.loadControls();
  };

  AppChange.prototype.loadControls = function(){
    var _this = this;

    var controls = new Controls(this.opt.controls);

    return controls.load();
  };

  AppChange.prototype.loadListeners = function(){
    var _this = this;

    var onSlide = function(resp) {
      _this.onSlide(resp.value);
    };
    var onButtonUp = function(value) {
      _this.onButtonUp(value);
    };

    var channel = new Channel(this.opt.controls.channel, {"role": "subscriber"});
    channel.addCallback("controls.axes.change", onSlide);
    channel.addCallback("controls.button.up", onButtonUp);
    channel.listen();

    $(window).on('resize', function(){
      _this.onResize();
    });

  };

  AppChange.prototype.onButtonUp = function(){
    this.globe.next();
    this.slideshow.next();
    this.sleep.wakeUp();
  };

  AppChange.prototype.onReady = function(){
    var d = this.data;

    var opt = _.extend({}, this.opt.slideshow, this.content);

    // Initialize slideshow
    this.slideshow = new Slideshow(opt);

    // Init globe
    opt = _.extend({}, this.opt.globe, this.content, {"geojson": d});
    this.globe = new Globe(opt);

    // Init sleep mode utilitys
    opt = _.extend({}, this.opt.sleep);
    this.sleep = new Sleep(opt);

    this.render();
  };

  AppChange.prototype.onResize = function(){
    this.globe.onResize();
  };

  AppChange.prototype.onSlide = function(value) {
    this.slideshow.onSlide(value);
    this.sleep.wakeUp();
  };

  AppChange.prototype.render = function() {
    var _this = this;

    this.globe.render();

    requestAnimationFrame(function(){ _this.render(); });
  };

  return AppChange;

})();
