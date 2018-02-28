'use strict';

function AppOceanAtmosphere(config, content, data) {
  var defaults = {};
  this.opt = _.extend({}, defaults, config);
  this.content = content;
  this.data = data;

  this.init();
}

AppOceanAtmosphere.prototype.init = function(){
  this.onReady();
  this.loadControls();
};

AppOceanAtmosphere.prototype.loadControls = function(){
  var _this = this;

  var controls = new Controls(this.opt.controls);

  return controls.load();
};

AppOceanAtmosphere.prototype.loadListeners = function(){
  var _this = this;
  var globes = this.globes;

  $(document).on("controls.axes.change", function(e, key, value) {
    switch(key) {
      case "horizontal":
        _this.onRotate("horizontal", value);
        break;
      case "vertical":
        _this.onRotate("vertical", value);
        break;
      default:
        break;
    }
  });

  $(window).on('resize', function(){
    _.each(globes, function(globe){
      globe.onResize();
    });
  });
};

AppOceanAtmosphere.prototype.onReady = function(){
  this.colorKey = new ColorKey(this.opt.colorKey);

  var globes = [];
  var globeOpt = this.opt.globe;
  var globesOpt = this.opt.globes;

  _.each(globesOpt, function(opt){
    globes.push(new Globe(_.extend({}, opt, globeOpt)));
  });

  this.globes = globes;
  this.calendar = new Calendar(_.extend({}, this.opt.calendar));

  this.loadListeners();

  this.render();
};

AppOceanAtmosphere.prototype.onRotate = function(axis, value){
  _.each(this.globes, function(globe){
    globe.onRotate(axis, value);
  });
};

AppOceanAtmosphere.prototype.render = function(){
  var _this = this;

  var globeTest = this.globes[0];
  var yearProgress = globeTest.getProgress();

  _.each(this.globes, function(globe){
    globe.render();
  });

  this.calendar.render(yearProgress);

  requestAnimationFrame(function(){ _this.render(); });
};
