'use strict';

var AppMitigation = (function() {

  function AppMitigation(config, content, data) {
    var defaults = {};
    this.opt = _.extend({}, defaults, config);
    this.content = content;
    this.data = data;

    this.init();
  }

  AppMitigation.prototype.init = function(){
    var _this = this;

    this.onReady();
    this.loadListeners();
    this.loadControls();
    this.loadSounds();
  };

  AppMitigation.prototype.loadControls = function(){
    var _this = this;

    var controls = new Controls(this.opt.controls);

    return controls.load();
  };

  AppMitigation.prototype.loadListeners = function(){
    var _this = this;
    var $document = $(document);

    var onRotate = function(e, value) {
      _this.onRotate(value);
    };

    $document.on("controls.rotate", onRotate);

    $(window).on('resize', function(){
      _this.onResize();
    });

  };

  AppMitigation.prototype.loadSounds = function(){
    var _this = this;

    var sound = new Sound(this.opt.sound);

    return sound.load();
  };

  AppMitigation.prototype.onReady = function(){
    var d = this.data;

    var opt = _.extend({}, this.opt.stories);

    // Initialize slideshow
    this.stories = new Stories(opt, this.content.stories);

    // Init globe
    opt = _.extend({}, this.opt.map, this.content);
    this.map = new Map(opt);

    // Init sleep mode utilitys
    // opt = _.extend({}, this.opt.sleep);
    // this.sleep = new Sleep(opt);

    // this.render();
  };

  AppMitigation.prototype.onResize = function(){
  };

  AppMitigation.prototype.onRotate = function(value){
    // this.sleep.wakeUp();
    this.stories.onRotate(value);
  };

  AppMitigation.prototype.render = function() {
    var _this = this;

    requestAnimationFrame(function(){ _this.render(); });
  };

  return AppMitigation;

})();
