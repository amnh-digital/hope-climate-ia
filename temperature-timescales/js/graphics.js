'use strict';

var Graphics = (function() {
  function Graphics(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
    this.monthTransitionStep = this.opt.monthTransitionStep;
    this.tenYearTrend = this.opt.tenYearTrend;
    this.yAxisLabelCount = this.opt.yAxis.labelCount;
    this.yAxisStep = this.opt.yAxis.step;
    this.yAxisMinBounds = this.opt.yAxis.minBounds;
    this.tenYearTrendYearsDisplay = this.opt.tenYearTrendYearsDisplay;

    // initialize data
    var d0 = this.domain[0];
    this.annualData = _.map(this.opt.annualData, function(d,i){
      var monthlyData = _.map(d[2], function(dd, j){
        return {
          year: d0 + i + j/12.0,
          month: j,
          value: dd[0],
          valueF: dd[0] * 1.8,
          yearValue: d[0],
          color: dd[1],
          index: j,
          x: 0,
          y: 0,
          highlighting: false,
          highlightStart: 0,
          highlightValue: 0
        };
      });
      return {
        year: d0 + i,
        month: -1,
        value: d[0],
        valueF: d[0] * 1.8,
        color: d[1],
        index: i,
        x: 0,
        y: 0,
        highlighting: false,
        highlightStart: 0,
        highlightValue: 0,
        monthlyData: monthlyData
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
    this.plotData = [];

    this.isMonthView = false; // are we viewing months?
    this.monthTransitionValue = 0; // 1=month view, 0=year view

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

    // check if we are viewing months
    var monthYearsDisplay = this.monthYearsDisplay;
    var delta = newDomainPrecise[1]-newDomainPrecise[0];
    var isMonthView = (delta <= monthYearsDisplay);
    this.isMonthView = isMonthView;
    var monthTransitionValue = this.monthTransitionValue;
    if (monthTransitionValue <= 0.0 && isMonthView) {
      monthTransitionValue = 0.001;
    } else if (monthTransitionValue >= 1.0 && !isMonthView) {
      monthTransitionValue = 0.999;
    }
    this.monthTransitionValue = monthTransitionValue;
    var monthTransitioning = (monthTransitionValue > 0 && monthTransitionValue < 1);

    var values = [];
    var plotData = [];
    var data = this.annualData;
    var yStart = Math.floor(domainStart);
    var yEnd = Math.ceil(domainEnd);
    var mStart = domainStart - 1.0/12.0;
    var mEnd = domainEnd + 1.0/12.0;
    _.each(data, function(d, i){
      if (d.year >= yStart && d.year <= yEnd) {
        if (isMonthView || monthTransitioning) {
          _.each(d.monthlyData, function(md, j){
            if (md.year >= mStart && md.year <= mEnd) {
              plotData.push(data[i].monthlyData[j]);
              values.push(md.value);
            }
          });
        } else {
          plotData.push(data[i]);
          values.push(d.value);
        }
      }
    });

    var yAxisStep = this.yAxisStep;
    var yAxisMinBounds = this.yAxisMinBounds;
    var minRange = UTIL.floorToNearest(_.min(values)-0.05, yAxisStep);
    var maxRange = UTIL.ceilToNearest(_.max(values)+0.05, yAxisStep);
    this.plotRange = [Math.min(yAxisMinBounds[0], minRange), Math.max(maxRange, yAxisMinBounds[1])];

    var domain = [newDomainPrecise[0], newDomainPrecise[1]+1];
    if (isMonthView || monthTransitioning) domain = [newDomainPrecise[0], newDomainPrecise[1]+1.0/12.0];
    var range = this.plotRange;
    var pd = this.plotDimensions;
    _.each(plotData, function(d, i){
      var p = dataToPoint(d.year, d.value, domain, range, pd);
      plotData[i].x = p[0];
      plotData[i].y = p[1];
    });
    this.plotData = plotData;

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
    var range = this.range;
    var domainPrecise = this.plotDomainPrecise;
    var yearPrecise = UTIL.lerp(domainPrecise[0], domainPrecise[1], time);
    var prevIndex = this.plotCurrentIndex;
    var plotData = this.plotData;
    var plotDataLen = plotData.length;

    this.dataCurrentPercent = UTIL.norm(yearPrecise, domain[0], domain[1]);
    var plotCurrentIndex = Math.round(this.time*(plotDataLen-1));
    this.plotCurrentIndex = plotCurrentIndex;
    this.plotCurrentValue = plotData[plotCurrentIndex];

    // add transition for index and play sound
    if ((prevIndex < plotCurrentIndex || time > prevTime && prevTime <= 0) && withSound !== false) {
      plotData[plotCurrentIndex].highlighting = true;
      plotData[plotCurrentIndex].highlightStart = new Date();
      plotData[plotCurrentIndex].highlightValue = 0;
      var mu = UTIL.norm(plotData[plotCurrentIndex].value, range[0], range[1]);
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
    var xAxisSubtextStyle = this.xAxisSubtextStyle;
    var yAxisTextStyle = this.yAxisTextStyle;
    var yAxisSubtextStyle = this.yAxisSubtextStyle;
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
        var label = new PIXI.Text("20th century", yAxisSubtextStyle);
        label.x = xLabel;
        label.y = y;
        label.anchor.set(1.0, 1.0);
        axes.addChild(label);

        label = new PIXI.Text("average", yAxisSubtextStyle);
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
        var sublabel = new PIXI.Text(subtext, yAxisSubtextStyle);
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
    var isMonthView = this.isMonthView;
    var monthTransitionValue = this.monthTransitionValue;
    var monthTransitioning = (monthTransitionValue > 0 && monthTransitionValue < 1);
    var plotData = this.plotData;
    var cw = xAxisBounds[2];
    var dataW = cw / (domainp[1]-domainp[0]+1);
    if (isMonthView || monthTransitioning) {
      dataW = cw / (domainp[1]-domainp[0]+1.0/12.0) / 12.0;
    }
    var labelY = xAxisBounds[1] + xAxisBounds[3] - xAxisTextStyle.fontSize;
    var lineY0 = xAxisBounds[1];
    var lineY1 = labelY - xAxisTextStyle.fontSize * 0.5;
    var boundLeft = xAxisBounds[0];
    var boundRight = xAxisBounds[0] + xAxisBounds[2];

    count = domain[1] - domain[0];
    var countp = domainp[1] - domainp[0];

    showEvery = 1;
    var tickEvery = 1;

    if (isMonthView || monthTransitioning) {
      showEvery = 6; // in months
      tickEvery = 2;

      if (countp < 1.1) {
        showEvery = 1;
        tickEvery = 1;

      } else if (countp < 2.1) {
        showEvery = 3;
        tickEvery = 1;
      }

    } else if (count > 80) {
      showEvery = 20;
      tickEvery = 5;

    } else if (count > 30) {
      showEvery = 10;
      tickEvery = 5;

    } else if (count > 10) {
      showEvery = 5;
    }

    _.each(plotData, function(d, i){
      var x = d.x + dataW * 0.5;
      var textStyle = xAxisTextStyle;
      if (x >= boundLeft && x <= boundRight) {

        axes.lineStyle(2, 0x444444, 1);
        var label = d.year;
        var value = parseInt(Math.round(d.year));
        if (d.month >= 0) {
          value = d.month;
          label = parseInt(Math.floor(d.year));
          if (value > 0) {
            textStyle = xAxisSubtextStyle;
            label = MONTHS[d.month];
          }
        }
        var showLabel = (value % showEvery === 0) || (count >= 130 && value==domain[1]);
        var showTick = (value % tickEvery === 0);
        if (showLabel) {
          axes.lineStyle(3, 0x888888, 1);
          var label = new PIXI.Text(label, textStyle);
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
    var text = current.year;
    if (current.month >= 0) {
      text = MONTHS[current.month] + " " + parseInt(current.year);
    }
    label = new PIXI.Text(text, textStyle);
    label.x = lx;
    label.y = cy + textStyle.fontSize * 1.5;
    label.anchor.set(anchorX, 0.0);
    marker.addChild(label);
  };

  Graphics.prototype.renderPlot = function(){
    var _this = this;
    var plotData = this.plotData;
    var domain = this.plotDomain;
    var domainp = this.plotDomainPrecise;
    var range = this.plotRange;
    var pd = this.plotDimensions;
    var plot = this.plot;
    var isMonthView = this.isMonthView;

    var monthTransitionValue = this.monthTransitionValue;
    var monthTransitioning = (monthTransitionValue > 0 && monthTransitionValue < 1);

    var cw = pd[2];
    var ch = pd[3];
    var dataW = cw / (domainp[1]-domainp[0]+1);
    if (monthTransitioning || isMonthView) {
      dataW = cw / (domainp[1]-domainp[0]+1.0/12.0) / 12.0;
    }

    var dataMargin = 0.5;
    var mx0 = pd[0];
    var p0 = dataToPoint(domain[0], 0, domainp, range, pd); // baseline
    var y0 = p0[1];
    var leftBoundX = mx0-dataW;
    var rightBoundX = mx0+cw;

    plot.clear();

    _.each(plotData, function(d, i){
      var value = d.value;
      var x = d.x;
      var y = d.y;
      var p;
      if (x < leftBoundX || x > rightBoundX) return;

      if (monthTransitioning && d.month >= 0) {
        var yearValue = d.yearValue;
        value = UTIL.lerp(yearValue, value, monthTransitionValue);
        p = dataToPoint(d.year, value, domainp, range, pd);
        y = p[1];
      }

      // bounce when we are highlighting bar
      if (d.highlighting) {
        var delta = 0.25;
        if (value < 0) delta *= -1;
        value = UTIL.lerp(value+delta, value, UTIL.easeInElastic(d.highlightValue, 0.01));
        if (!isNaN(value)) {
          p = dataToPoint(d.year, value, domainp, range, pd);
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

      var ry = y;
      var rh = y0-y;
      if (y > y0) {
        ry = y0;
        rh = y-y0;
      }

      if (rh > 0) {
        plot.drawRect(x+dataMargin, ry, w, rh);
        if (d.highlighting && d.highlightValue > 0 && d.highlightValue < 0.25) {
          var highlightValue = 1.0 - d.highlightValue * 4;
          plot.beginFill(0xFFFFFF, highlightValue*0.1);
          plot.drawRect(x+dataMargin, ry, w, rh);
        }
      }
    });
  };

  Graphics.prototype.renderTrend = function(){
    var domain = this.plotDomain;
    var count = domain[1]-domain[0];
    var tenYearTrendYearsDisplay = this.tenYearTrendYearsDisplay;
    var trend = this.trend;

    trend.clear();

    if (count < tenYearTrendYearsDisplay) return false;

    var pd = this.plotDimensions;
    var domainp = this.plotDomainPrecise;
    var range = this.plotRange;
    var cw = pd[2];
    var ch = pd[3];
    var dataW = cw / (domainp[1]-domainp[0]+1);
    var plotData = this.plotData;
    var trendData = this.tenYearTrend;

    trend.lineStyle(3, 0xffffff, 0.4);
    var first = true;
    _.each(plotData, function(d, i){
      var x = d.x + dataW * 0.5;
      var value = trendData[d.index];
      var p = dataToPoint(d.year, value, domainp, range, pd);
      var y = p[1];
      if (first) {
        trend.moveTo(x, y);
        first = false;
      } else {
        trend.lineTo(x, y);
      }
    });
  };

  Graphics.prototype.transition = function(){
    this.monthTransitioning = (this.monthTransitionValue > 0 && this.monthTransitionValue < 1);

    if (!this.transitioning && !this.monthTransitioning) return false;

    // bar highlight transition
    if (this.transitioning) {
      var _this = this;
      var range = this.plotRange;
      var highlightMs = this.opt.highlightMs;
      var transitioning = false;
      var now = new Date();
      var plotData = this.plotData;
      _.each(plotData, function(d, i){
        if (d.highlighting && d.highlightStart) {
          var diff = now - d.highlightStart;
          if (diff >= highlightMs) {
            diff = highlightMs;
            plotData[i].highlighting = false;
          } else {
            transitioning = true;
          }
          var progress = diff / highlightMs;
          progress = Math.max(progress, 0);
          progress = Math.min(progress, 1);
          plotData[i].highlightValue = progress;
        }
      });
      this.transitioning = transitioning;
    }

    // month transition
    if (this.monthTransitioning) {
      var step = this.monthTransitionStep;
      var value = this.monthTransitionValue;
      if (this.isMonthView) value += step;
      else value -= step;
      value = UTIL.clamp(value, 0, 1);
      this.monthTransitionValue = value;
      if (value <= 0) {
        this.onScaleChange(this.scale);
      }
    }

    this.renderPlot();
  };

  return Graphics;

})();
