'use strict';

var Graphics = (function() {
  function Graphics(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  function dataToPercent(dx, dy, domain, range){
    var px = UTIL.norm(dx, domain[0], domain[1]);
    var py = UTIL.norm(dy, range[0], range[1]);
    return [px, py];
  };

  function dataToPoint(dx, dy, domain, range, bounds){
    var p = dataToPercent(dx, dy, domain, range);
    return percentToPoint(p[0], p[1], bounds);
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
        active: false,
        x: 0,
        y: 0
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
        active: false,
        x: 0,
        y: 0
      };
    });

    this.yearCount = this.annualData.length;
    this.time = this.opt.time;
    this.scale = this.opt.scale;

    this.plotDomain = []; // the current visible domain, e.g. [1900, 1950]
    this.plotDomainPrecise = []; // like above but precise to the decimal, e.g. [1899.5, 1950.25]
    this.plotRange = []; // the current visible range in Celsius departure from average, e.g. [-1, 1.5]
    this.dataCurrentPercent = 0; // number between 0 and 1 indicating where the marker is relative to the entire dataset
    this.plotCurrentIndex = 0; // current active index of dataset
    this.plotCurrentValue = {}; // current active value

    this.refreshDimensions();
    this.initView();
    this.initTime();
    this.onScaleChange(this.scale)
  };

  Graphics.prototype.initTime = function(){
    var time = this.time;
    var domain = this.domain;

    var i = Math.round((domain[1]-domain[0]) * time);

    this.dataCurrentPercent = time;
    this.plotCurrentIndex = i;
    this.plotCurrentValue = this.annualData[i];
  };

  Graphics.prototype.initView = function(){
    this.app = new PIXI.Application(this.width, this.height, {backgroundColor : 0x000000, antialias: true});
    this.axes = new PIXI.Graphics();
    this.plot = new PIXI.Graphics();
    this.trend = new PIXI.Graphics();
    this.marker = new PIXI.Graphics();

    this.app.stage.addChild(this.plot, this.axes, this.trend, this.marker);

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
    var dataCurrentPercent = this.dataCurrentPercent;
    var minDomainCount = this.minYearsDisplay;
    var maxDomainCount = this.yearCount;
    var domainCount = UTIL.lerp(minDomainCount, maxDomainCount, scale);

    var domainCountP = domainCount / maxDomainCount;
    var domainStartP = dataCurrentPercent - (domainCountP * time);
    var domainEndP = dataCurrentPercent + (domainCountP * (1-time));

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
    var data = this.annualData;
    _.each(data, function(d, i){
      if (d.year >= Math.floor(domainStart) && d.year <= Math.ceil(domainEnd)) {
        data[i].active = true;
        data[i].x = 0;
        data[i].y = 0;

        values.push(d.value);
      } else {
        data[i].active = false;
      }
    });

    var yAxisStep = this.yAxisStep;
    var yAxisMinBounds = this.yAxisMinBounds;
    var minRange = UTIL.floorToNearest(_.min(values)-0.05, yAxisStep);
    var maxRange = UTIL.ceilToNearest(_.max(values)+0.05, yAxisStep);
    this.plotRange = [Math.min(yAxisMinBounds[0], minRange), Math.max(maxRange, yAxisMinBounds[1])];

    var domain = [newDomainPrecise[0], newDomainPrecise[1]+1];
    var range = this.plotRange;
    var pd = this.plotDimensions;
    _.each(data, function(d, i){
      if (d.active) {
        var p = dataToPoint(d.year, d.value, domain, range, pd);
        data[i].x = p[0];
        data[i].y = p[1];
      }
    });

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
    var prevIndex = this.plotCurrentIndex;
    var data = this.annualData;

    this.dataCurrentPercent = UTIL.norm(yearPrecise, domain[0], domain[1]);
    var plotCurrentIndex = Math.round(UTIL.lerp(domain[0], domain[1], this.dataCurrentPercent)) - domain[0];
    this.plotCurrentIndex = plotCurrentIndex;
    this.plotCurrentValue = data[this.plotCurrentIndex];
    // console.log(this.plotCurrentValue.year)

    // add transition for index and play sound
    if ((prevIndex < plotCurrentIndex || time > prevTime && prevTime <= 0) && withSound !== false) {
      data[plotCurrentIndex].highlighting = true;
      data[plotCurrentIndex].highlightStart = new Date();
      data[plotCurrentIndex].highlightValue = 0;
      var mu = UTIL.norm(data[plotCurrentIndex].value, this.range[0], this.range[1]);
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
    this.transition();
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
    var axes = this.axes;

    axes.clear();
    while(axes.children[0]) {
      axes.removeChild(axes.children[0]);
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
        axes.addChild(label);

        label = new PIXI.Text("average", yAxissubextStyle);
        label.x = xLabel;
        label.y = y;
        label.anchor.set(1.0, 0);
        axes.addChild(label);

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

        axes.addChild(label);
        axes.addChild(sublabel);
      }

      if (dc===0) axes.lineStyle(3, 0xffffff, 0.6);
      else axes.lineStyle(1, 0xffffff, 0.2);
      axes.moveTo(lineX0, y).lineTo(lineX1, y);

      value -= yAxisStep;
      i += 1;
    }

    // draw x axis
    var data = this.annualData;
    var cw = xAxisBounds[2];
    var dataW = cw / (domainp[1]-domainp[0]+1);
    var labelY = xAxisBounds[1] + xAxisBounds[3] - xAxisTextStyle.fontSize;
    var lineY0 = xAxisBounds[1];
    var lineY1 = labelY - xAxisTextStyle.fontSize * 0.5;
    var boundLeft = xAxisBounds[0];
    var boundRight = xAxisBounds[0] + xAxisBounds[2];

    count = domain[1] - domain[0];
    var showMonths = (count <= this.monthYearsDisplay);
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
    }

    _.each(data, function(d, i){
      var x = d.x + dataW * 0.5;
      if (d.active && x >= boundLeft && x <= boundRight) {

        axes.lineStyle(2, 0x444444, 1);
        var value = parseInt(Math.round(d.year));
        var showLabel = (value % showEvery === 0) || (count >= 130 && value==domain[1]);
        var showTick = (value % tickEvery === 0);
        if (showLabel) {
          axes.lineStyle(3, 0x888888, 1);
          var text = value;
          var label = new PIXI.Text(text, xAxisTextStyle);
          label.x = x;
          label.y = labelY;
          label.anchor.set(0.5, 0);
          axes.addChild(label);
        }
        if (showTick) {
          axes.moveTo(x, lineY0).lineTo(x, lineY1);
        }

      }
    });
  };

  Graphics.prototype.renderMarker = function(){
    // draw plot marker
    var current = this.plotCurrentValue;
    var pd = this.plotDimensions;
    var marker = this.marker;

    marker.clear();
    while(marker.children[0]) {
      marker.removeChild(marker.children[0]);
    }

    var cx = pd[0];
    var cy = pd[1];
    var cw = pd[2];
    var ch = pd[3]
    var x = pd[0] + cw * this.time;
    var marginX = cw * 0.01;

    // label bg
    var labelW = cw * 0.18;
    var thresholdX = cw + cx - labelW;
    // var labelH = ch * 0.1;
    // marker.beginFill(0x777070, 0.2);
    // marker.drawRect(x, cy, labelW, labelH);
    // marker.endFill();

    marker.lineStyle(5, 0xf1a051, 0.7);
    marker.moveTo(x, cy).lineTo(x, cy + ch);

    var textStyle = this.markerTextStyle;
    var dc = UTIL.round(current.value, 1);
    var df = UTIL.round(current.valueF, 1);
    var text = dc + "°C ("+df+" °F)";
    var label = new PIXI.Text(text, textStyle);

    var anchorX = 0.0;
    var lx = x + marginX;
    if (x > thresholdX) {
      anchorX = 1.0;
      lx = x - marginX;
    }

    label.x = lx;
    label.y = cy;
    label.anchor.set(anchorX, 0.0);
    marker.addChild(label);

    textStyle = _.clone(textStyle);
    textStyle.fontSize *= 0.9;
    label = new PIXI.Text(current.year, textStyle);
    label.x = lx;
    label.y = cy + textStyle.fontSize * 1.5;
    label.anchor.set(anchorX, 0.0);
    marker.addChild(label);
  };

  Graphics.prototype.renderPlot = function(){
    var _this = this;
    var data = this.annualData;
    var domain = this.plotDomain;
    var domainp = this.plotDomainPrecise;
    var range = this.plotRange;
    var pd = this.plotDimensions;
    var plot = this.plot;

    var cw = pd[2];
    var ch = pd[3];
    var dataW = cw / (domainp[1]-domainp[0]+1);
    var dataMargin = 0.5;
    var mx0 = pd[0];
    var p0 = dataToPoint(domain[0], 0, domainp, range, pd); // baseline
    var y0 = p0[1];

    plot.clear();

    _.each(data, function(d, i){
      if (d.active) {
        var value = d.value;
        var x = d.x;
        var y = d.y;
        // bounce when we are highlighting bar
        if (d.highlighting) {
          var delta = 0.25;
          if (value < 0) delta *= -1;
          value = UTIL.lerp(value+delta, value, UTIL.easeInElastic(d.highlightValue, 0.01));
          if (!isNaN(value)) {
            var p = dataToPoint(d.year, value, domainp, range, pd);
            y = p[1];
          }
        }
        var w = dataW - dataMargin * 2;
        // clip the sides off the edges
        if (x < mx0) {
          w -= (mx0 - x);
          x = mx0;
        }
        if (x > (mx0 + cw - dataW)) {
          w -= (x - (mx0 + cw - dataW));
        }
        plot.beginFill(d.color);

        if (y < y0) {
          plot.drawRect(x+dataMargin, y, w, y0-y);

        } else if (y > y0) {
          plot.drawRect(x+dataMargin, y0, w, y-y0);
        }
      }
    });
  };

  Graphics.prototype.renderTrend = function(){

  };

  Graphics.prototype.transition = function(){
    if (!this.transitioning) return false;

    var _this = this;
    var range = this.plotRange;
    var highlightMs = this.opt.highlightMs;
    var transitioning = false;
    var now = new Date();
    var data = this.annualData;

    _.each(data, function(d, i){
      if (d.highlighting && d.highlightStart) {
        var diff = now - d.highlightStart;
        if (diff >= highlightMs) {
          diff = highlightMs;
          data[i].highlighting = false;
        } else {
          transitioning = true;
        }
        var progress = diff / highlightMs;
        progress = Math.max(progress, 0);
        progress = Math.min(progress, 1);
        data[i].highlightValue = progress;
      }
    });

    this.transitioning = transitioning;
    this.renderPlot();
  };

  return Graphics;

})();
