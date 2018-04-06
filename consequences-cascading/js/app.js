'use strict';

var AppCascading = (function() {

  function AppCascading(config, content, data) {
    var defaults = {};
    this.opt = _.extend({}, defaults, config);
    this.content = content;
    this.data = data;

    this.init();
  }

  AppCascading.prototype.init = function(){
    var _this = this;

    this.onReady();
    this.loadListeners();
    this.loadControls();
    this.loadSounds();
  };

  AppCascading.prototype.loadControls = function(){
    var _this = this;

    var controls = new Controls(this.opt.controls);

    return controls.load();
  };

  AppCascading.prototype.loadListeners = function(){
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

  AppCascading.prototype.loadSounds = function(){
    var _this = this;

    var sound = new Sound(this.opt.sound);

    return sound.load();
  };

  AppCascading.prototype.onReady = function(){
    var d = this.data;

    var opt = _.extend({}, this.opt.network, this.content);

    // Initialize slideshow
    this.network = new Network(opt);

    // Init sleep mode utilitys
    // opt = _.extend({}, this.opt.sleep);
    // this.sleep = new Sleep(opt);

    this.render();
  };

  AppCascading.prototype.onResize = function(){
  };

  AppCascading.prototype.onRotate = function(value){
    // this.sleep.wakeUp();
    this.network.onRotate(value);
  };

  AppCascading.prototype.render = function() {
    var _this = this;

    this.network.render();

    requestAnimationFrame(function(){ _this.render(); });
  };

  return AppCascading;

})();
