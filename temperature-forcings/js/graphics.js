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
    this.observedData = this.opt.observed;
    this.forcingsContent = this.opt.forcings;
    this.forcingsData = this.opt.data;
    this.transitionStep = this.opt.transitionStep;
    this.cordConfig = this.opt.cord;

    // cord config details:
    // curveRatio: 0.45,
    // ampMin: 0.1, // min oscillation height in px
    // oscRange: [0.005, 0.01], // frequency / oscillation speed; lower means slower
    // tensityRange: [0.05, 0.1], // how tense the string is; lower means less tense
    // ampRange: [10, 50] // starting perpendicular height of oscillating string in px

    this.forcingsState = _.mapObject(this.forcingsContent, function(val, key) {
      return {
        state: false,
        progress: 0
      };
    });

    this.forcingsColors = _.mapObject(this.forcingsContent, function(val, key){
      return parseInt("0x"+val.color.slice(1), 16);
    });

    this.cordsActive = false;
    this.plotActive = false;

    this.refreshDimensions();
    this.initView();
  };

  Graphics.prototype.initView = function(){
    this.app = new PIXI.Application(this.width, this.height, {backgroundColor : 0x000000, antialias: true});
    var axes = new PIXI.Graphics();
    var plot = new PIXI.Graphics();
    var cords = new PIXI.Graphics();
    var observed = new PIXI.Graphics();

    this.app.stage.addChild(observed, cords, axes, plot);

    // add label buffers to axes
    // increase this if you are getting "Cannot set property 'text' of undefined" error
    addLabelBuffers(observed, 1);
    addLabelBuffers(axes, 36);

    this.axes = axes;
    this.cords = cords;
    this.observed = observed;
    this.plot = plot;

    this.$el.append(this.app.view);

    this.renderAxes();
    this.renderObserved();
    this.renderPlot();
    this.renderCords();
  };

  Graphics.prototype.forcingOff = function(value){
    this.forcingsState[value].state = -1;
    this.plotActive = true;
  };

  Graphics.prototype.forcingOn = function(value){
    this.forcingsState[value].state = 1;
    this.plotActive = true;
  };

  Graphics.prototype.onResize = function(){
    this.refreshDimensions();
    this.app.renderer.resize(this.width, this.height);

    this.renderAxes();
    this.renderObserved();
    this.renderPlot();
    this.renderCords();
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

    this.pointRadius = h * 0.01;
  };

  Graphics.prototype.render = function(){


    if (this.plotActive) {
      this.transitionPlot();
      this.renderPlot();
    }

    if (this.cordsActive) {
      this.transitionCords();
      this.renderCords();
    }
  };

  Graphics.prototype.renderAxes = function(){
    var _this = this;
    var domain = this.domain;
    var range = this.range;
    var pd = this.plotDimensions;
    var xAxisBounds = this.xAxisDimensions;
    var yAxisBounds = this.yAxisDimensions;
    var xAxisTextStyle = this.xAxisTextStyle;
    var xAxisSubtextStyle = this.xAxisSubtextStyle;
    var yAxisTextStyle = this.yAxisTextStyle;
    var yAxisSubtextStyle = this.yAxisSubtextStyle;
    var axes = this.axes;
    var labelCount = axes.children.length;
    var yAxisGradient = this.opt.yAxis.gradient;

    axes.clear();

    var cx = pd[0];
    var cy = pd[1];
    var cw = pd[2];
    var ch = pd[3];

    // draw y axis
    axes.lineStyle(1, 0xc4ced4);
    axes.moveTo(cx, cy).lineTo(cx, cy + ch);

    var labelIndex = 0;
    var value = range[1];
    var labelEvery = 0.5;
    var tickEvery = 0.25;
    var xLabel = cx - yAxisBounds[2] * 0.1667;
    var xLine = cx - yAxisBounds[2] * 0.1;
    var colorIndex = 0;
    while(value >= range[0]) {
      var p = dataToPoint(0, value, domain, range, yAxisBounds);
      var y = p[1];

      if (value % labelEvery === 0.0) {
        var label = axes.children[labelIndex];
        var sublabel = axes.children[labelIndex+1];
        labelIndex += 2;

        var fill = yAxisGradient[colorIndex];
        colorIndex += 1;

        var text = UTIL.round(value, 1) + "°C";
        var subtext = UTIL.round(value * 1.8, 1) + "°F";

        if (value === 0.0) {
          text = "20th century";
          subtext = "average";
        } else if (value > 0) {
          text = "+" + text;
          subtext = "+" + subtext;
        }

        if (value !== 0.0) subtext = "(" +subtext+ ")";

        var style = _.extend({}, yAxisTextStyle, {fill: fill});
        var subStyle = _.extend({}, yAxisSubtextStyle, {fill: fill});
        if (value === 0.0) subStyle = _.extend({}, yAxisTextStyle, {fill: fill});

        label.text = text;
        label.style = style;
        label.anchor.set(1.0, 1.0);
        label.x = xLabel;
        label.y = y;

        sublabel.text = subtext;
        sublabel.anchor.set(1.0, 0);
        sublabel.x = xLabel;
        sublabel.y = y;
        sublabel.style = subStyle;
      }

      if (value === 0.0) axes.lineStyle(3, 0xffffff);
      else axes.lineStyle(1, 0xffffff);
      axes.moveTo(xLine, y).lineTo(cx, y);

      value -= tickEvery;
    }

    value = domain[0];
    labelEvery = 20;
    tickEvery = 5;
    var yLabel = cy + ch + yAxisBounds[2] * 0.25;
    var yLine = cy + ch + yAxisBounds[2] * 0.1;

    while(value <= domain[1]) {
      var showTick = (value % tickEvery === 0.0 || value === domain[0] || value === domain[1]);
      var showLabel = (value % labelEvery === 0.0 || value === domain[0] || value === domain[1]);

      if (showTick || showLabel) {
        var p = dataToPoint(value, 0, domain, range, xAxisBounds);
        var x = p[0];

        if (showLabel) {
          var label = axes.children[labelIndex];
          labelIndex++;

          label.text = value;
          label.style = xAxisTextStyle;
          label.anchor.set(0.5, 0);
          label.x = x;
          label.y = yLabel;
        }

        axes.lineStyle(1, 0xffffff);
        axes.moveTo(x, cy + ch).lineTo(x, yLine);
      }

      value ++;
    }

    // hide the remainder of labels
    for (var i=labelIndex; i<labelCount; i++) {
      axes.children[i].text="";
    }
  };

  Graphics.prototype.renderCords = function(){

  };

  Graphics.prototype.renderObserved = function(){
    var _this = this;

    var data = this.observedData;
    var len = data.length;
    var range = this.range;
    var pd = this.plotDimensions;
    var observed = this.observed;

    var cx = pd[0];
    var cy = pd[1];
    var cw = pd[2];
    var ch = pd[3];

    observed.clear();

    var barW = cw / len;
    var rangeRatio = range[1] / (range[1]-range[0]);
    observed.lineStyle(1, 0x000000);

    _.each(data, function(value, i){
      var x = i * barW + cx;
      var y = 0;
      var barH = 0;

      if (value > 0) {
        barH = (value / range[1]) * ch * rangeRatio;
        y = cy + ch * rangeRatio - barH;
      } else {
        barH = (value / range[0] )* ch * (1-rangeRatio);
        y = cy + ch * rangeRatio;
      }

      observed.beginFill(0x333333);
      observed.drawRect(x, y, barW, barH);
    });
  };

  Graphics.prototype.renderPlot = function(){
    var forcingsState = this.forcingsState;
    var forcingsData = this.forcingsData;
    var plot = this.plot;
    var domain = this.domain;
    var range = this.range;
    var pd = this.plotDimensions;
    var forcingsColors = this.forcingsColors;
    var len = domain[1] - domain[0];
    var pointRadius = this.pointRadius;

    plot.clear();

    _.each(forcingsState, function(value, key){
      if (value.state !== false) {
        var progress = value.progress;
        var data = forcingsData[key].data;
        var color = forcingsColors[key];

        // draw line
        plot.lineStyle(3, color);
        _.each(data, function(v, i){
          var p = 1.0 * i / len;

          if (p <= progress) {
            var dx = domain[0] + i;
            var dy = v;
            var point = dataToPoint(dx, dy, domain, range, pd);

            if (i<=0) {
              plot.moveTo(point[0], point[1]);
            } else {
              plot.lineTo(point[0], point[1]);
            }
          }

        });

        // draw point
        var i = parseInt(Math.round(progress * len));
        var v = data[i];
        var dx = domain[0] + i;
        var dy = v;
        var point = dataToPoint(dx, dy, domain, range, pd);
        plot.beginFill(color);
        plot.drawCircle(point[0], point[1], pointRadius);
        plot.endFill();

      }
    });
  };

  Graphics.prototype.transitionCords = function(){};

  Graphics.prototype.transitionPlot = function(){
    var _this = this;
    var transitionStep = this.transitionStep;

    var plotActive = false;
    _.each(this.forcingsState, function(value, key){
      var state = value.state;
      var progress = value.progress;
      if (state !== true && state !==false) {

        // line going forward
        if (state > 0) {
          // reached the end
          if (progress >= 1.0) {
            _this.forcingsState[key].state = true;
            _this.forcingsState[key].progress = 1.0;
          // still transitioning
          } else {
            _this.forcingsState[key].progress += transitionStep;
            plotActive = true;
          }

        // line going backward
        } else {
          // reached the beginning
          if (progress <= 0.0) {
            _this.forcingsState[key].state = false;
            _this.forcingsState[key].progress = 0.0;
          // still transitioning
          } else {
            _this.forcingsState[key].progress -= transitionStep;
            plotActive = true;
          }
        }
      }
    });

    this.plotActive = plotActive;
  };

  return Graphics;

})();
