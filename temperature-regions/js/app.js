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

  $.when.apply($, [dataPromise, controlPromise]).then(function(){
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
        _this.onZoneChange(value);
        break;
      default:
        break;
    }
  });

  $(window).on('resize', function(){
    _this.onResize();
  });

};

App.prototype.onDataLoaded = function(d){
  this.data = d;
};

App.prototype.onReady = function(){
  var d = this.data;

  var opt = _.extend({}, this.opt.graphics, this.data);

  // Initialize viz
  this.graphics = new Graphics(opt);

  // Init sleep mode utilitys
  opt = _.extend({}, this.opt.sleep);
  this.sleep = new Sleep(opt);

  this.loadListeners();
  this.render();
};

App.prototype.onResize = function(){
  this.graphics.onResize();
};

App.prototype.onTimeChange = function(value) {
  this.graphics.onTimeChange(value);
  this.sleep.wakeUp();
};

App.prototype.onZoneChange = function(value) {
  this.graphics.onZoneChange(value);
  this.sleep.wakeUp();
};

App.prototype.render = function(){
  var _this = this;

  this.graphics.render();

  requestAnimationFrame(function(){ _this.render(); });
};
