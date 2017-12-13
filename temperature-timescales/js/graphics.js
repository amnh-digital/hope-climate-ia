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
    this.time = this.opt.time;
    this.scale = this.opt.scale;

    this.plotDomain = [];
    this.plotDomainPrecise = [];
    this.plotRange = [];
    this.dataIndex = 0;
    this.plotIndex = 0;
    this.plotYear = {};

    this.refreshDimensions();
    this.initView();
    this.initTime();
    this.onScaleChange(this.scale)
  };

  Graphics.prototype.initTime = function(){
    var time = this.time;
    var domain = this.domain;

    var i = Math.round((domain[1]-domain[0]) * time);

    this.dataIndex = time;
    this.plotIndex = i;
    this.plotYear = this.annualData[i];
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

  Graphics.prototype.onScaleChange = function(scale){
    // console.log("scale", scale);
    this.scale = scale;

    var _this = this;

    var time = this.time;
    var dataIndex = this.dataIndex;
    var minDomainCount = this.minYearsDisplay;
    var maxDomainCount = this.yearCount;
    var domainCount = UTIL.lerp(minDomainCount, maxDomainCount, scale);

    var domainCountP = domainCount / maxDomainCount;
    var domainStartP = dataIndex - (domainCountP * time);
    var domainEndP = dataIndex + (domainCountP * (1-time));

    // adjust edges
    if (domainStartP < 0) {
      domainEndP -= domainStartP;
      domainStartP = 0;
    }
    if (domainEndP > 1) {
      domainStartP -= (domainEndP-1)
      domainEndP = 1;
    }

    // determine new domain
    var domain = this.domain;
    var d0 = domain[0];
    var d1 = domain[1];
    var domainStart = UTIL.lerp(d0, d1, domainStartP);
    var domainEnd = UTIL.lerp(d0, d1, domainEndP);
    var newDomainPrecise = [domainStart, domainEnd];
    var newDomain = [Math.ceil(domainStart), Math.floor(domainEnd)];

    this.plotDomain = newDomain;
    this.plotDomainPrecise = newDomainPrecise;

    var values = [];
    _.each(this.annualData, function(d, i){
      if (d.year >= Math.floor(domainStart) && d.year <= Math.ceil(domainEnd)) {
        _this.annualData[i].active = true;
        values.push(d.value);
      } else {
        _this.annualData[i].active = false;
      }
    });

    var yAxisStep = this.opt.yAxisStep;
    var minRange = UTIL.floorToNearest(_.min(values), yAxisStep);
    var maxRange = UTIL.ceilToNearest(_.max(values), yAxisStep);
    this.plotRange = [minRange, maxRange];

    this.onTimeChange(this.time, false);

    this.renderAxes();
    this.renderTrend();
    this.renderMarker();
    this.renderPlot();
  };

  Graphics.prototype.onTimeChange = function(time, withSound){
    // console.log("time", value);
    var prevTime = this.time;
    this.time = time;

    var domain = this.domain;
    var domainPrecise = this.plotDomainPrecise;
    var yearPrecise = UTIL.lerp(domainPrecise[0], domainPrecise[1], time);
    var prevIndex = this.plotIndex;

    this.dataIndex = UTIL.norm(yearPrecise, domain[0], domain[1]);
    var plotIndex = Math.round(UTIL.lerp(domain[0], domain[1], this.dataIndex)) - domain[0];
    this.plotIndex = plotIndex;
    this.plotYear = this.annualData[this.plotIndex];
    // console.log(this.plotYear.year)

    // add transition for index and play sound
    if ((prevIndex < plotIndex || time > prevTime && prevTime <= 0) && withSound !== false) {
      this.annualData[plotIndex].highlighting = true;
      this.annualData[plotIndex].highlightStart = new Date();
      this.annualData[plotIndex].highlightValue = 0;
      var mu = UTIL.norm(this.annualData[plotIndex].value, this.range[0], this.range[1]);
      $(document).trigger("sound.play.percent", [mu]);
    }

    this.transitioning = true;
    this.transition();
    this.renderMarker();
  };

  Graphics.prototype.refreshDimensions = function(){
    this.width = this.$el.width();
    this.height = this.$el.height();

    var m = this.opt.margin;
    this.margin = [m[0]*this.height, m[1]*this.width, m[2]*this.height, m[3]*this.width];
    this.xAxisWidth = this.opt.xAxis.width * this.width;
    this.yAxisHeight = this.opt.yAxis.height * this.height;
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

  Graphics.prototype.transition = function(){

  };

  return Graphics;

})();
