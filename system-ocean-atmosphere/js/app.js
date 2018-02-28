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
};

AppOceanAtmosphere.prototype.loadListeners = function(){
  var _this = this;

  var globes = this.globes;

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
