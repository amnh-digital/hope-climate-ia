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

    this.storyCount = this.content.stories.length;
    this.currentStoryIndex = 0;
    this.angleThreshold = this.opt.angleThreshold;
    this.angleDelta = 0;
    this.$document = $(document);

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
    var $window = $(window);

    var onRotate = function(value) {
      _this.onRotate(value);
    };
    var channel = new Channel(this.opt.controls.channel, {"role": "subscriber"});
    channel.addCallback("controls.rotate", onRotate);
    channel.listen();

    $window.on('resize', function(){
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
    opt = _.extend({}, this.opt.sleep);
    this.sleep = new Sleep(opt);

    this.render();
  };

  AppMitigation.prototype.onResize = function(){
  };

  AppMitigation.prototype.onRotate = function(delta){
    this.sleep.wakeUp();

    var count = this.storyCount;
    var angleThreshold = this.angleThreshold;
    var index = 0;
    var changed = false;

    // check to see if we reached the threshold for going to the next story
    var angleDelta = this.angleDelta + delta;
    var changed = Math.abs(angleDelta) >= angleThreshold;
    if (changed && angleDelta < 0) index = this.currentStoryIndex - 1;
    else if (changed) index = this.currentStoryIndex + 1;
    if (index < 0) index = count - 1;
    if (index >= count) index = 0;
    this.angleDelta = angleDelta;

    // first load
    if (this.currentStoryIndex < 0) {
      index = 0;
      changed = true;
    }

    if (changed) {
      this.stories.onChange(index);
      this.map.onChange(index);
      this.currentStoryIndex = index;
      this.$document.trigger("sound.play.sprite", ["tick"]);
      this.angleDelta = 0;
    }
  };

  AppMitigation.prototype.render = function() {
    var _this = this;

    this.stories.render();

    requestAnimationFrame(function(){ _this.render(); });
  };

  return AppMitigation;

})();
