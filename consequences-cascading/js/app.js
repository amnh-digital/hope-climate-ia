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

    var controlPromise = this.loadControls();
    var soundPromise = this.loadSounds();
    var imagesPromise = this.loadImages();

    $.when.apply($, [imagesPromise]).then(function(){
      _this.onReady();
      _this.loadListeners();
    });
  };

  AppCascading.prototype.loadControls = function(){
    var _this = this;

    var controls = new Controls(this.opt.controls);

    return controls.load();
  };

  AppCascading.prototype.loadImages = function(){
    var _this = this;

    // Initialize images
    var opt = _.extend({}, this.opt.images, this.content);
    this.images = new Images(opt);

    return this.images.load();
  };

  AppCascading.prototype.loadListeners = function(){
    var _this = this;
    var $document = $(document);
    var $window = $(window);
    var throttleMs = this.opt.network.throttleMs;

    var onRotate = _.throttle(function(value) {
      // console.log(value)
      _this.onRotate(value);
    }, throttleMs);
    var channel = new Channel(this.opt.controls.channel, {"role": "subscriber"});
    channel.addCallback("controls.rotate.horizontal", onRotate);
    channel.listen();

    var onFactboxHide = function(e, value){ _this.factbox.hide(); };
    var onFactboxReset = function(e, branch){ _this.factbox.reset(branch); };
    var onFactboxShow = function(e, branch){ _this.factbox.show(branch); };
    var onFactboxTransition = function(e, value){ _this.factbox.transition(value); };
    $document.on("factbox.hide", onFactboxHide);
    $document.on("factbox.reset", onFactboxReset);
    $document.on("factbox.show", onFactboxShow);
    $document.on("factbox.transition", onFactboxTransition);

    var onProgressShow = function(e, index) { _this.progress.show(index); }
    $document.on("progress.show", onProgressShow);

    var onSleepStart = function(e, value) { _this.onSleepStart(); }
    var onSleepEnd = function(e, value) { _this.onSleepEnd(); }
    $document.on("sleep.start", onSleepStart);
    $document.on("sleep.end", onSleepEnd);

    var onResize = function(){ _this.onResize(); }
    $window.on('resize', onResize);
  };

  AppCascading.prototype.loadSounds = function(){
    var _this = this;

    var sound = new Sound(this.opt.sound);

    return sound.load();
  };

  AppCascading.prototype.onBranchChange = function(branch){
    this.factbox.onBranchChange(branch);
  };

  AppCascading.prototype.onReady = function(){
    var d = this.data;

    // Initialize network
    var opt = _.extend({}, this.opt.network, this.content);
    this.network = new Network(opt);

    // Initialize factbox
    opt = _.extend({}, this.opt.factbox, this.content);
    this.factbox = new FactBox(opt);

    // Initialize progress
    this.progress = new Progress({count: this.content.network.length});

    // Init sleep mode utilitys
    opt = _.extend({}, this.opt.sleep);
    this.sleep = new Sleep(opt);

    this.render();
  };

  AppCascading.prototype.onResize = function(){
  };

  AppCascading.prototype.onRotate = function(delta){
    this.sleep.wakeUp();
    this.network.onRotate(delta);
  };

  AppCascading.prototype.onSleepStart = function(){
    this.network.sleepStart();
  };

  AppCascading.prototype.onSleepEnd = function(delta){
    this.network.sleepEnd();
  };

  AppCascading.prototype.render = function() {
    var _this = this;

    this.network.render();

    requestAnimationFrame(function(){ _this.render(); });
  };

  return AppCascading;

})();
