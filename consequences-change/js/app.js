'use strict';

var AppChange = (function() {

  function AppChange(config, content) {
    var defaults = {};
    this.opt = _.extend({}, defaults, config);
    this.content = content;

    this.init();
  }

  AppChange.prototype.init = function(){
    var _this = this;

    var slides = this.content.slideshow.slice(0);
    var slideCount = slides.length;
    this.slides = _.map(slides, function(slide, i){
      slide.index = i;
      slide.isLast = (i >= (slideCount-1));
      return slide;
    });

    this.slideCount = slideCount;
    this.currentSlide = -1;
    this.transitioning = false;

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
      _this.onButtonUp();
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
    if (this.transitioning) return false;
    this.sleep.wakeUp();

    this.transitioning = true;
    this.transitionStart = new Date();

    this.currentSlide += 1;
    if (this.currentSlide >= this.slideCount) {
      this.currentSlide = 0;
    }

    var slide = this.slides[this.currentSlide];
    this.globe.next(slide);
    this.slideshow.next(slide);
    this.progress.show(this.currentSlide);
  };

  AppChange.prototype.onReady = function(){
    var _this = this;
    var opt = _.extend({}, this.opt.slideshow, {"slides": this.slides});

    // Initialize slideshow
    this.slideshow = new Slideshow(opt);

    // Init globe
    opt = _.extend({}, this.opt.globe, {"slides": this.slides});
    this.globe = new Globe(opt);
    var globePromise = this.globe.loadEarth();

    // Initialize progress
    this.progress = new Progress({count: this.slides.length});

    // Go to first slide when ready
    $.when(globePromise).done(function(resp){
      _this.onButtonUp();
    });

    // Init sleep mode utilitys
    opt = _.extend({}, this.opt.sleep);
    this.sleep = new Sleep(opt);

    this.render();
  };

  AppChange.prototype.onResize = function(){
    this.globe.onResize();
    this.slideshow.onResize();
  };

  AppChange.prototype.onSlide = function(value) {
    this.slideshow.onSlide(value);
    this.sleep.wakeUp();
  };

  AppChange.prototype.render = function() {
    var _this = this;

    if (this.transitioning) {
      var now = new Date();
      var delta = now - this.transitionStart;
      var progress = delta / this.opt.animationMs;
      if (progress >= 1.0) progress = 1.0;

      this.globe.transitionEarth(progress);
      this.globe.render();

      if (progress >= 1.0) {
        this.transitioning = false;
      }
    }

    requestAnimationFrame(function(){ _this.render(); });
  };

  return AppChange;

})();
