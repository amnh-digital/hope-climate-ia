'use strict';

var Graphics = (function() {
  function Graphics(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  function addLabelBuffers(g, labelBufferCount) {
    for (var i=0; i<labelBufferCount; i++) {
      var label = new PIXI.Text("");
      g.addChild(label);
    }
  }

  function dataToPercent(dx, dy, domain, range){
    var px = UTIL.norm(dx, domain[0], domain[1]);
    var py = UTIL.norm(dy, range[0], range[1]);
    return [px, py];
  }

  function dataToPoint(dx, dy, domain, range, bounds){
    var p = dataToPercent(dx, dy, domain, range);
    return percentToPoint(p[0], p[1], bounds);
  }

  function percentToPoint(px, py, bounds){
    var bx = bounds[0];
    var by = bounds[1];
    var bw = bounds[2];
    var bh = bounds[3];

    var x = px * bw + bx;
    var y = by + bh - (py * bh);

    return [x, y];
  };

  Graphics.prototype.init = function(){
    this.$el = $(this.opt.el);

    this.domain = this.opt.domain;
    this.range = this.opt.range;

    this.time = this.opt.time;
    this.zone = this.opt.zone;

    this.refreshDimensions();
    this.initView();
  };

  Graphics.prototype.initView = function(){
    this.app = new PIXI.Application(this.width, this.height, {backgroundColor : 0x000000, antialias: true});
    var axes = new PIXI.Graphics();
    var plot = new PIXI.Graphics();
    var marker = new PIXI.Graphics();

    this.app.stage.addChild(plot, axes, marker);

    // add label buffers to axes
    // increase this if you are getting "Cannot set property 'text' of undefined" error
    addLabelBuffers(axes, 30);
    addLabelBuffers(marker, 2);

    this.axes = axes;
    this.plot = plot;
    this.marker = marker;

    this.$el.append(this.app.view);
  };

  Graphics.prototype.onResize = function(){
    this.refreshDimensions();
    this.app.renderer.resize(this.width, this.height);

    this.renderAxes();
    this.renderPlot();
    this.renderMarker();
  };

  Graphics.prototype.onTimeChange = function(time){

  };

  Graphics.prototype.onZoneChange = function(zone){

  };

  Graphics.prototype.refreshDimensions = function(){
    var w = this.$el.width();
    var h = this.$el.height();

    this.width = w;
    this.height = h;

    var m = this.opt.margin.slice(0);
    m = [m[0]*h, m[1]*w, m[2]*h, m[3]*w];

    // make calculations for x and y axes
    var xAxisH = this.opt.xAxis.height * h;
    var yAxisW = this.opt.yAxis.width * w;
    var yAxisH = h - m[0] - m[2] - xAxisH;
    var yAxisX = m[3];
    var yAxisY = m[0];
    var xAxisX = yAxisX + yAxisW;
    var xAxisY = yAxisY + yAxisH;
    var xAxisW = w - m[1] - m[3] - yAxisW;
    this.xAxisDimensions = [xAxisX, xAxisY, xAxisW, xAxisH];
    this.yAxisDimensions = [yAxisX, yAxisY, yAxisW, yAxisH];

    var xAxisTextStyle = _.extend({}, this.opt.xAxis.textStyle);
    var xAxisSubtextStyle = _.extend({}, this.opt.xAxis.subtextStyle);
    var yAxisTextStyle = _.extend({}, this.opt.yAxis.textStyle);
    var yAxisSubtextStyle = _.extend({}, this.opt.yAxis.subtextStyle);
    xAxisTextStyle.fontSize *= h;
    xAxisSubtextStyle.fontSize *= h;
    yAxisSubtextStyle.fontSize *= h;
    yAxisTextStyle.fontSize *= h;
    this.xAxisTextStyle = xAxisTextStyle;
    this.xAxisSubtextStyle = xAxisSubtextStyle;
    this.yAxisSubtextStyle = yAxisSubtextStyle;
    this.yAxisTextStyle = yAxisTextStyle;

    // make calculations for plot
    var plotX = yAxisX + yAxisW;
    var plotY = yAxisY;
    var plotW = xAxisW;
    var plotH = yAxisH;
    this.plotDimensions = [plotX, plotY, plotW, plotH];

    // marker
    var markerTextStyle = _.extend({}, this.opt.marker.textStyle);
    markerTextStyle.fontSize *= h;
    this.markerTextStyle = markerTextStyle;
  };

  Graphics.prototype.render = function(){
  };

  Graphics.prototype.renderAxes = function(){

  };

  Graphics.prototype.renderMarker = function(){

  };

  Graphics.prototype.renderPlot = function(){

  };

  return Graphics;

})();
