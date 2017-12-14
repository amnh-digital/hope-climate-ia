'use strict';

var Graphics = (function() {
  function Graphics(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  function dataToPoint(dx, dy, domain, range, bounds){
    var px = UTIL.norm(dx, domain[0], domain[1]);
    var py = UTIL.norm(dy, range[0], range[1]);
    return percentToPoint(px, py, bounds);
  };

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
    this.minYearsDisplay = this.opt.minYearsDisplay;
    this.monthYearsDisplay = this.opt.monthYearsDisplay;
    this.yAxisLabelCount = this.opt.yAxis.labelCount;
    this.yAxisStep = this.opt.yAxis.step;
    this.yAxisMinBounds = this.opt.yAxis.minBounds;

    // initialize data
    var d0 = this.domain[0];
    this.annualData = _.map(this.opt.annualData, function(d,i){
      return {
        year: d0 + i,
        value: d[0],
        valueF: d[0] * 1.8,
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
        valueF: d[0] * 1.8,
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

    var yAxisStep = this.yAxisStep;
    var yAxisMinBounds = this.yAxisMinBounds;
    var minRange = UTIL.floorToNearest(_.min(values), yAxisStep);
    var maxRange = UTIL.ceilToNearest(_.max(values), yAxisStep);
    this.plotRange = [Math.min(yAxisMinBounds[0], minRange), Math.max(maxRange, yAxisMinBounds[1])];

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
    var w = this.$el.width();
    var h = this.$el.height();

    this.width = w;
    this.height = h;

    var m = this.opt.margin;
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
    var yAxisTextStyle = _.extend({}, this.opt.yAxis.textStyle);
    var yAxissubextStyle = _.extend({}, this.opt.yAxis.subtextStyle);
    xAxisTextStyle.fontSize *= h;
    yAxissubextStyle.fontSize *= h;
    yAxisTextStyle.fontSize *= h;
    this.xAxisTextStyle = xAxisTextStyle;
    this.yAxissubextStyle = yAxissubextStyle;
    this.yAxisTextStyle = yAxisTextStyle;

    // make calculations for plot
    var plotX = xAxisX + xAxisW;
    var plotY = yAxisY;
    var plotW = xAxisW;
    var plotH = yAxisH;
    this.plotDimensions = [plotX, plotY, plotW, plotH];
  };

  Graphics.prototype.render = function(){

  };

  Graphics.prototype.renderAxes = function(){
    var _this = this;
    var domain = this.plotDomain;
    var domainp = this.plotDomainPrecise;
    var range = this.plotRange;
    var xAxisBounds = this.xAxisDimensions;
    var yAxisBounds = this.yAxisDimensions;
    var xAxisTextStyle = this.xAxisTextStyle;
    var yAxisTextStyle = this.yAxisTextStyle;
    var yAxissubextStyle = this.yAxissubextStyle;

    this.axes.clear();
    while(this.axes.children[0]) {
      this.axes.removeChild(this.axes.children[0]);
    }

    // determine labels and ticks for y axis
    var delta = range[1] - range[0];
    var yAxisStep = this.yAxisStep;
    var count = delta / yAxisStep;
    var showEvery = 1;
    if (count > 16) showEvery = 4;
    else if (count > 8) showEvery = 2;

    var i = 0;
    var value = range[1];
    var xLabel = yAxisBounds[0] + yAxisBounds[2] * 0.667;
    var lineX0 = xAxisBounds[0];
    var lineX1 = xAxisBounds[0] + xAxisBounds[2];

    // draw y axis

    while(value >= range[0]) {

      var p = dataToPoint(0, value, domain, range, yAxisBounds);
      var y = p[1];
      var dc = UTIL.round(value, 1);
      var df = UTIL.round(value * 1.8, 1);

      if (dc===0) {
        var text = "20th century average";
        var label = new PIXI.Text("20th century", yAxissubextStyle);
        label.x = xLabel;
        label.y = y;
        label.anchor.set(1.0, 1.0);
        this.axes.addChild(label);

        label = new PIXI.Text("average", yAxissubextStyle);
        label.x = xLabel;
        label.y = y;
        label.anchor.set(1.0, 0);
        this.axes.addChild(label);

      } else if (i % showEvery === 0) {
        var text = dc + "°C";
        var label = new PIXI.Text(text, yAxisTextStyle);
        label.x = xLabel;
        label.y = y;
        label.anchor.set(1.0, 1.0);

        var subtext = "(" + df + " °F)";
        var sublabel = new PIXI.Text(subtext, yAxissubextStyle);
        sublabel.x = xLabel;
        sublabel.y = y;
        sublabel.anchor.set(1.0, 0);

        this.axes.addChild(label);
        this.axes.addChild(sublabel);
      }

      if (dc===0) this.axes.lineStyle(3, 0xffffff, 0.6);
      else this.axes.lineStyle(1, 0xffffff, 0.2);
      this.axes.moveTo(lineX0, y).lineTo(lineX1, y);

      value -= yAxisStep;
      i += 1;
    }

    // draw x axis
    count = domain[1] - domain[0];
    showEvery = 1;
    var tickEvery = 1;
    if (count > 80) {
      showEvery = 20;
      tickEvery = 5;

    } else if (count > 30) {
      showEvery = 10;
      tickEvery = 5;

    } else if (count > 10) {
      showEvery = 5;
      tickEvery = 1;
    }
    value = domain[0];
    i = 0;
    var cw = xAxisBounds[2];
    var dataW = cw / (domainp[1]-domainp[0]+1);
    var labelY = xAxisBounds[1] + xAxisBounds[3] - xAxisTextStyle.fontSize;
    var lineY0 = xAxisBounds[1];
    var lineY1 = labelY - xAxisTextStyle.fontSize * 0.5;

    while (value <= domain[1]) {
      var delta1 = domain[1] - value;
      var delta2 = value - domain[0];
      var showLabel = (value === domain[0] || value === domain[1] || value % showEvery === 0) && (delta1 >= showEvery/2 || delta1 <= 0) && (delta2 >= showEvery/2 || delta2 <= 0);
      var showTick = (value % tickEvery === 0);
      var p, px, x;

      if (showLabel || showTick) {
        p = dataToPoint(value, range[0], domain, range, xAxisBounds);
        px = UTIL.norm(value, domainp[0], domainp[1]+1);
        x = px * cw + lineX0 + dataW * 0.5;
      }
      this.axes.lineStyle(2, 0x444444, 1);
      if (showLabel) {
        this.axes.lineStyle(3, 0x888888, 1);
        var text = value;
        var xAnchor = 0.5;
        var label = new PIXI.Text(text, xAxisTextStyle);
        if (count > 10) {
          if (value == domain[0]) {
            x = lineX0;
            xAnchor = 0;
          } else if (value==domain[1]) {
            x = lineX0+cw;
            xAnchor = 1;
          }
        }
        label.x = x;
        label.y = labelY;
        label.anchor.set(xAnchor, 0);
        this.axes.addChild(label);
      }
      if (showTick) {
        this.axes.moveTo(x, lineY0).lineTo(x, lineY1);
      }
      value++;
      i++;
    }

    // var lw = h * 0.0075;
    // var lh = m[3] * h * 0.2;
    // var ly0 = h - lw * 0.5 - m[3]*h*0.4;
    // var ly1 = h - lw * 0.5 - lh;
    // this.axes.lineStyle(lw, 0x2a2a2a, 1);
    // this.axes.moveTo(mx0, ly0).lineTo(mx0, ly1).lineTo(mx0+cw, ly1).lineTo(mx0+cw, ly0);
    // this.axes.moveTo(mx0 + cw*0.5, ly1).lineTo(mx0 + cw*0.5, h);
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
