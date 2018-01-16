'use strict';

function App(options) {
  var defaults = {};
  this.opt = _.extend({}, defaults, options);
  this.init();
}

App.prototype.init = function(){
  var _this = this;

  this.forcings = this.opt.forcings;

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
  var $document = $(document);

  var buttonDown = function(e, value) {
    _this.onButtonDown(value);
  };
  var buttonUp = function(e, value) {
    _this.onButtonUp(value);
  };
  var resize = function(){
    _this.onResize();
  };

  $document.on("controls.button.down", buttonDown);
  $document.on("controls.button.up", buttonUp);
  $(window).on('resize', resize);

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

  var opt = _.extend({}, this.opt.graphics, this.data, {forcings: this.forcings});

  // Initialize viz
  this.graphics = new Graphics(opt);

  // Init sleep mode utilitys
  opt = _.extend({}, this.opt.sleep);
  this.sleep = new Sleep(opt);

  // Init messages
  opt = _.extend({}, this.opt.messages, {forcings: this.forcings});
  this.messages = new Messages(opt);

  this.loadListeners();
  this.render();
};

App.prototype.onResize = function(){
  this.graphics.onResize();
};

App.prototype.onButtonDown = function(value) {
  console.log("Button down " + value);
  this.graphics.forcingOn(value);
  this.messages.forcingOn(value);
  this.sleep.wakeUp();
};

App.prototype.onButtonUp = function(value) {
  console.log("Button up " + value);
  this.graphics.forcingOff(value);
  this.messages.forcingOff(value);
  this.sleep.wakeUp();
};

App.prototype.render = function(){
  var _this = this;

  this.graphics.render();

  requestAnimationFrame(function(){ _this.render(); });
};
