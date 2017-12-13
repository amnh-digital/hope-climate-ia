'use strict';

var Graphics = (function() {
  function Graphics(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Graphics.prototype.init = function(){
    this.$el = $(this.opt.el);

    this.domain = this.opt.domain;
    this.range = this.opt.range;
    this.minYearsDisplay = this.opt.minYearsDisplay;
    this.monthYearsDisplay = this.opt.monthYearsDisplay;

    // initialize data
    var d0 = this.domain[0];
    this.annualData = _.map(this.opt.annualData, function(d,i){
      return {
        year: d0 + i,
        value: d[0],
        color: d[1],
        index: i,
        active: false
      };
    });
    this.monthlyData = _.map(this.opt.monthlyData, function(d,i){
      var year = d0 + Math.floor(i/12);
      var month = i % 12;
      return {
        year: year,
        month: month,
        value: d[0],
        color: d[1],
        index: i,
        active: false
      };
    });

    this.yearCount = this.annualData.length;
    this.time = 0.5;
    this.scale = 0.5;

    this.refreshDimensions();
    this.initView();
  };

  Graphics.prototype.initView = function(){
    this.app = new PIXI.Application(this.width, this.height, {backgroundColor : 0x000000, antialias: true});
    this.axes = new PIXI.Graphics();
    this.plot = new PIXI.Graphics();
    this.highlight = new PIXI.Graphics();
    this.trend = new PIXI.Graphics();
    this.marker = new PIXI.Graphics();

    this.app.stage.addChild(this.plot, this.highlight, this.axes, this.trend, this.marker);

    this.$el.append(this.app.view);
  };

  Graphics.prototype.onResize = function(){
    this.refreshDimensions();
    this.app.renderer.resize(this.width, this.height);

    this.renderAxes();
    this.renderPlot();
    this.renderTrend();
    this.renderMarker();
  };

  Graphics.prototype.onScaleChange = function(value){
    // console.log("scale", value);
  };

  Graphics.prototype.onTimeChange = function(value){
    // console.log("time", value);
  };

  Graphics.prototype.refreshDimensions = function(){
    this.width = this.$el.width();
    this.height = this.$el.height();
  };

  Graphics.prototype.render = function(){

  };

  Graphics.prototype.renderAxes = function(){

  };

  Graphics.prototype.renderHighlight = function(){

  };

  Graphics.prototype.renderMarker = function(){

  };

  Graphics.prototype.renderPlot = function(){

  };

  Graphics.prototype.renderTrend = function(){

  };

  return Graphics;

})();
