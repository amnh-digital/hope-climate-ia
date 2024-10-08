'use strict';

var Graphics = (function() {
  var isAccessibleText = false;

  function Graphics(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function addLabelBuffers(view, g, labelBufferCount) {
    for (var i=0; i<labelBufferCount; i++) {
      var label = isAccessibleText ? new AccessibleText(view, "") : new PIXI.Text("");
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
    this.minYearsDisplay = this.opt.minYearsDisplay;
    this.monthYearsDisplay = this.opt.monthYearsDisplay;
    this.monthTransitionStep = this.opt.monthTransitionStep;
    this.tenYearTrend = this.opt.tenYearTrend;
    this.yAxisLabelCount = this.opt.yAxis.labelCount;
    this.yAxisStep = this.opt.yAxis.step;
    this.yAxisMinBounds = this.opt.yAxis.minBounds;
    this.tenYearTrendYearsDisplay = this.opt.tenYearTrendYearsDisplay;
    this.sleepTransitionMs = this.opt.sleepTransitionMs;
    this.bgColor = parseInt(this.opt.plot.bgColor);
    this.axesLineColor = parseInt(this.opt.yAxis.lineColor);
    this.axesTickColor = parseInt(this.opt.xAxis.tickColor);

    isAccessibleText = this.opt.accessibleText;

    this.parseData();

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
    this.onScaleChange(this.scale);

    if (isAccessibleText) {
      var _this = this;
      setTimeout(function(){
        _this.renderAxes();
        _this.renderMarker();
        _this.renderAnnotations();
      }, 100);
    }

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
    var _this = this;
    this.app = new PIXI.Application(this.width, this.height, {backgroundColor : 0x000000, antialias: true});
    var bg = new PIXI.Graphics();
    var axes = new PIXI.Graphics();
    var plot = new PIXI.Graphics();
    // var trend = new PIXI.Graphics();
    var annotations = new PIXI.Graphics();
    var images = new PIXI.Container();
    var marker = new PIXI.Graphics();
    var flag = new PIXI.Graphics();

    this.app.stage.addChild(bg, axes, plot, annotations, flag, marker, images);

    // add images as sprites
    _.each(this.annualData, function(d, i){
      if (d.annotation && d.annotation.image) {
        var sprite = PIXI.Sprite.fromImage(d.annotation.image);
        sprite.visible = false;
        images.addChild(sprite);
        _this.annualData[i].annotation.sprite = sprite;
        _this.annualData[i].annotation.imageRatio = d.annotation.imageW / d.annotation.imageH;
      }
    });

    this.$el.append(this.app.view);

    // add label buffers to axes
    // increase this if you are getting "Cannot set property 'text' of undefined" error
    addLabelBuffers(this.app.view, axes, 24);
    addLabelBuffers(this.app.view, plot, 30);
    addLabelBuffers(this.app.view, flag, 5);
    addLabelBuffers(this.app.view, annotations, this.opt.annotations.length);

    // add resting filter
    this.restingFilter = false;
    var $shader = $("#resting-fragment-shader");
    if ($shader.length) {
      var fragSrc = $shader.text();
      var restingFilter = new PIXI.Filter(null, fragSrc);
      restingFilter.uniforms.progress = 0;
      plot.filters = [restingFilter];
      this.restingFilter = restingFilter;
    }

    this.bg = bg;
    this.axes = axes;
    this.plot = plot;
    // this.trend = trend;
    this.annotations = annotations;
    this.marker = marker;
    this.flag = flag;
    this.images = images;

    this.images.visible = false;

    // for what to show during "sleep mode"
    this.sleepers = [bg, axes, annotations, flag, images];
    this.dreamers = [plot, marker];


  };

  Graphics.prototype.onResize = function(){
    this.refreshDimensions();
    this.app.renderer.resize(this.width, this.height);
    this.onScaleChange(this.scale);

    this.renderBg();
    this.renderAxes();
    this.renderPlot();
    // this.renderTrend();
    this.renderMarker();
    this.renderAnnotations();
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
    var autoScrolled = false;
    if (domainStartP < 0) {
      domainEndP -= domainStartP;
      domainStartP = 0;
      autoScrolled = true;
    }
    if (domainEndP > 1) {
      domainStartP -= (domainEndP-1)
      domainEndP = 1;
      autoScrolled = true;
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
    // if user zooms out quickly, don't show transition
    if (delta > monthYearsDisplay*2) {
      monthTransitionValue = 0;
    }
    var monthTransitioned = (this.monthTransitionValue !== monthTransitionValue) && (monthTransitionValue>=1 || monthTransitionValue<=0);
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
    minRange = Math.min(yAxisMinBounds[0], minRange);
    maxRange = Math.max(maxRange, yAxisMinBounds[1]);
    var absMax = Math.max(Math.abs(minRange), maxRange);
    if (absMax > maxRange) maxRange = absMax;
    if (-absMax < minRange) minRange = -absMax;
    this.plotRange = [UTIL.round(minRange, 1), UTIL.round(maxRange, 1)];

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

    if (autoScrolled || monthTransitioning || monthTransitioned) this.onTimeChange(this.time, false);
    this.renderBg();
    this.renderAxes();
    // this.renderTrend();
    this.renderMarker();
    this.renderPlot();
    this.renderAnnotations();
  };

  Graphics.prototype.onTimeChange = function(time, withSound){
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
    this.yearPrecise = yearPrecise;

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
    this.renderBg();
    this.renderMarker();
    this.renderAnnotations();
    // this.renderTrend();
  };

  Graphics.prototype.parseData = function(){
    var annotations = _.map(this.opt.annotations, function(a){
      return [""+a.year, a];
    });
    var annotationIndex = _.object(annotations);
    var annotationRanges = _.filter(this.opt.annotations, function(a){ return a.years; });

    this.annotationRanges = annotationRanges;

    // initialize data
    var d0 = this.domain[0];
    this.annualData = _.map(this.opt.annualData, function(d,i){
      // retrieve month data
      var monthlyData = _.map(d[2], function(dd, j){
        return {
          year: d0 + i + j/12.0,
          month: j,
          value: dd[0],
          valueF: dd[0] * 1.8,
          color: dd[1],
          yearValue: d[0],
          yearColor: d[1],
          index: j,
          x: 0,
          y: 0,
          highlighting: false,
          highlightStart: 0,
          highlightValue: 0
        };
      });
      // retrieve annotation
      var annotation = false;
      var year = d0 + i;
      if (_.has(annotationIndex, "" + year)) {
        annotation = annotationIndex["" + year];
      } else {
        var foundAnnotationRange = _.filter(annotationRanges, function(a){ return year >= a.years[0] && year <= a.years[1]; });
        if (foundAnnotationRange.length > 0) annotation = foundAnnotationRange[0];
      }
      return {
        year: year,
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
        monthlyData: monthlyData,
        annotation: annotation
      };
    });
  };

  Graphics.prototype.refreshDimensions = function(){
    var w = this.$el.width();
    var h = this.$el.height();
    var minFontSize = this.opt.minFontSize;

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
    xAxisTextStyle.fontSize = Math.max(minFontSize, xAxisTextStyle.fontSize);
    xAxisSubtextStyle.fontSize = Math.max(minFontSize, xAxisSubtextStyle.fontSize);
    yAxisSubtextStyle.fontSize = Math.max(minFontSize, yAxisSubtextStyle.fontSize);
    yAxisTextStyle.fontSize = Math.max(minFontSize, yAxisTextStyle.fontSize);
    this.xAxisTextStyle = xAxisTextStyle;
    this.xAxisSubtextStyle = xAxisSubtextStyle;
    this.yAxisSubtextStyle = yAxisSubtextStyle;
    this.yAxisTextStyle = yAxisTextStyle;
    this.baselineTextStyle = _.extend({}, yAxisTextStyle, {fill: "#ffffff"});

    // make calculations for plot
    var plotX = yAxisX + yAxisW;
    var plotY = yAxisY;
    var plotW = xAxisW;
    var plotH = yAxisH;
    this.plotDimensions = [plotX, plotY, plotW, plotH];

    // marker
    var markerTextStyle = _.extend({}, this.opt.marker.textStyle);
    markerTextStyle.fontSize *= h;
    markerTextStyle.fontSize = Math.max(minFontSize, markerTextStyle.fontSize);
    this.markerTextStyle = markerTextStyle;
    this.markerDotRadius = this.opt.marker.dotRadius * h;
    this.markerWidthStep = this.opt.marker.widthStep * plotW;
  };

  Graphics.prototype.render = function(){
    this.transition();
  };

  Graphics.prototype.renderAnnotations = function(){
    var _this = this;
    var domain = this.plotDomain;
    var domainp = this.plotDomainPrecise;
    var range = this.plotRange;
    var plotData = this.plotData;
    var annotations = this.annotations;
    var pd = this.plotDimensions;
    var current = this.plotCurrentValue;
    var isMonthView = this.isMonthView;
    var color = parseInt(this.opt.annotationsUI.color);
    var highlightColor = parseInt(this.opt.annotationsUI.highlightColor);
    var labelCount = annotations.children.length;
    var labelIndex = 0;

    annotations.clear();

    if (isMonthView) {
      // hide the labels
      for (var i=labelIndex; i<labelCount; i++) {
        annotations.children[i].text="";
      }
      return false;
    }

    var cw = pd[2];
    var ch = pd[3];
    var dataW = cw / (domainp[1]-domainp[0]+1);

    var mx0 = pd[0];
    var p0 = dataToPoint(domain[0], 0, domainp, range, pd); // baseline
    var y0 = p0[1];
    var leftBoundX = mx0+dataW/2;
    var rightBoundX = mx0+cw-dataW/2;
    var marginY = ch * 0.1 / plotData.length;
    var markerRadius = dataW * 0.4;
    var limit = 10;
    if (plotData.length <= limit) {
      markerRadius = cw / limit * 0.4;
    }
    var fontSize = markerRadius * 1.5;
    var p;
    var textStyle = {
      "fill": "#151616",
      "fontSize": fontSize,
      "fontWeight": "bold"
    };
    var now = new Date();

    _.each(plotData, function(d, i){
      if (!d.annotation || d.annotation.years) return;

      var x = d.x;
      var y = d.y;
      var value = d.value;
      if (x < leftBoundX || x > rightBoundX) return;

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

      var aMarkerY = y - marginY - markerRadius;
      if (d.y > y0) {
        aMarkerY = y + marginY + markerRadius;
      }
      var aMarkerX = x + dataW / 2;

      var aColor = color;
      if (current.index === d.index) aColor = highlightColor;
      annotations.beginFill(aColor);
      annotations.drawCircle(aMarkerX, aMarkerY, markerRadius);
      annotations.endFill();
      var label = annotations.children[labelIndex];
      label.text = "i";
      label.style = textStyle;
      label.x = aMarkerX;
      label.y = aMarkerY;
      label.anchor.set(0.5, 0.5);
      labelIndex += 1;
    });

    // hide the remainder of the labels
    for (var i=labelIndex; i<labelCount; i++) {
      annotations.children[i].text="";
    }
  };

  Graphics.prototype.renderAxes = function(){
    var _this = this;
    var domain = this.plotDomain;
    var domainp = this.plotDomainPrecise;
    var range = this.plotRange;
    var pd = this.plotDimensions;
    var xAxisBounds = this.xAxisDimensions;
    var yAxisBounds = this.yAxisDimensions;
    var xAxisTextStyle = this.xAxisTextStyle;
    var xAxisSubtextStyle = this.xAxisSubtextStyle;
    var yAxisTextStyle = this.yAxisTextStyle;
    var yAxisSubtextStyle = this.yAxisSubtextStyle;
    var baselineTextStyle = this.baselineTextStyle;
    var axes = this.axes;
    var labelCount = axes.children.length;
    var lineWidth = this.opt.yAxis.lineWidth;
    var lineWidthBold = this.opt.yAxis.lineWidthBold;
    var axesLineColor = this.axesLineColor;
    var axesTickColor = this.axesTickColor;
    var embed = this.opt.embed;

    axes.clear();

    // determine labels and ticks for y axis
    var delta = range[1] - range[0];
    var yAxisStep = this.yAxisStep;
    var count = parseInt(Math.round(delta / yAxisStep));
    var halfRange = [UTIL.round(UTIL.floorToNearest(this.plotRange[0]/2, yAxisStep), 1), UTIL.round(UTIL.ceilToNearest(this.plotRange[1]/2, yAxisStep), 1)];

    var i = 0;
    var labelIndex = 0;
    var value = range[1];
    var xLabel = yAxisBounds[0] + yAxisBounds[2] * 0;
    var lineX0 = xAxisBounds[0];
    var lineX1 = xAxisBounds[0] + xAxisBounds[2];

    // draw y axis

    while(i <= count) {

      var label;
      var p = dataToPoint(0, value, domain, range, yAxisBounds);
      var y = p[1];
      var dc = UTIL.round(value, 1);
      var df = UTIL.round(value * 1.8, 1);

      var showLabel = (i === 0 || i === count || dc === halfRange[0] || dc === halfRange[1]);

      if (dc===0) {
        if (embed) {
          label = axes.children[labelIndex];
          label.text = "1901–2000";
          label.style = baselineTextStyle;
          label.x = lineX0 * 0.9;
          label.y = y;
          label.anchor.set(1.0, 1.0);
          labelIndex += 1;

          label = axes.children[labelIndex];
          label.text = "average";
          label.style = baselineTextStyle;
          label.x = lineX0 * 0.9;
          label.y = y;
          label.anchor.set(1.0, 0.0);
          labelIndex += 1;

        } else {
          label = axes.children[labelIndex];
          label.text = "1901–2000 average";
          label.style = baselineTextStyle;
          label.x = 0;
          label.y = y;
          label.anchor.set(-0.25, 0.5);
          labelIndex += 1;
        }

        // y axis label
        // label = axes.children[labelIndex];
        // label.text = "Change from 20th century average temperature";
        // label.style = _.extend({}, yAxisTextStyle, {
        //   fontSize: yAxisTextStyle.fontSize * 0.9,
        //   letterSpacing: yAxisTextStyle.fontSize * 0.1
        // });
        // label.x = xLabel * 0.1;
        // label.y = y;
        // label.anchor.set(0.5, 0);
        // label.rotation = UTIL.radians(-90);
        // labelIndex += 1;

      } else if (showLabel) {
        label = axes.children[labelIndex];
        if (dc > 0) {
          dc = "+" + dc;
          df = "+" + df;
        }
        label.text = dc + "°C";
        label.style = yAxisTextStyle;
        label.x = xLabel * 0.9;
        label.y = y;
        label.anchor.set(1.0, 0.5);
        labelIndex += 1;

        label = axes.children[labelIndex];
        label.text = df + " °F";
        label.style = yAxisSubtextStyle;
        label.x = xLabel;
        label.y = y;
        label.anchor.set(0.0, 0.5);
        labelIndex += 1;
      }

      if (dc===0) axes.lineStyle(lineWidthBold, 0xffffff);
      else axes.lineStyle(lineWidth, axesLineColor);
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

    var showEvery = 1;
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

        axes.lineStyle(2, axesTickColor, 1);
        var text = d.year;
        var value = parseInt(Math.round(d.year));
        if (d.month >= 0) {
          value = d.month;
          text = parseInt(Math.floor(d.year));
          if (value > 0) {
            textStyle = xAxisSubtextStyle;
            text = MONTHS[d.month];
          }
        }
        var showLabel = (value % showEvery === 0) || (count >= 130 && value==domain[1]);
        if (showLabel && (showEvery == 20) && value == 2023) {
            showLabel = false;  //don't show 2023 on top of 2020
        }
        var showTick = (value % tickEvery === 0);
        if (showLabel && labelIndex < labelCount) {
          axes.lineStyle(3, axesTickColor, 1);
          var label = axes.children[labelIndex];
          label.text = text;
          label.style = textStyle;
          label.x = x;
          label.y = labelY;
          label.anchor.set(0.5, 0);
          labelIndex += 1;
        }
        if (showTick) {
          axes.moveTo(x, lineY0).lineTo(x, lineY1);
        }

      }
    });

    // hide the remainder of labels
    for (var i=labelIndex; i<labelCount; i++) {
      axes.children[i].text="";
    }
  };

  Graphics.prototype.renderBg = function(){
    var _this = this;
    var pd = this.plotDimensions;
    var bg = this.bg;

    // draw bg
    bg.clear();
    bg.beginFill(this.bgColor);
    bg.drawRect(pd[0], pd[1], pd[2], pd[3]);
    bg.endFill();

    var scaleThreshold = this.opt.annotationsUI.scaleThreshold;
    var showAnnotation = (this.scale <= scaleThreshold);
    if (!showAnnotation) return false;

    var current = this.plotCurrentValue;
    var yearPrecise = this.yearPrecise;
    if (!current.annotation || !current.annotation.years) return false;

    var yrange = current.annotation.years;
    var y0 = yrange[0];
    var y1 = yrange[1];
    if (!UTIL.within(yearPrecise, y0, y1)) return false;

    // Display annotation range
    var domainp = this.plotDomainPrecise;
    var color = parseInt(this.opt.annotationsUI.rangeColor);
    if (y0 < domainp[0]) y0 = domainp[0];
    if (y1 > domainp[1]) y1 = domainp[1];
    var w = (y1 - y0) / (domainp[1] - domainp[0]) * pd[2];
    var x = UTIL.norm(y0, domainp[0], domainp[1]) * pd[2] + pd[0];
    bg.beginFill(color);
    bg.drawRect(x, pd[1], w, pd[3]);
    bg.endFill();
  };

  Graphics.prototype.renderMarker = function(){
    // draw plot marker
    var prev = this.prev;
    var current = this.plotCurrentValue;
    var pd = this.plotDimensions;
    var marker = this.marker;
    var flag = this.flag;
    var yLabel = flag.children[0];
    var cLabel = flag.children[1];
    var fLabel = flag.children[2];
    var aLabel = flag.children[3];
    var lLabel = flag.children[4];
    var markerColor = parseInt(this.opt.marker.color);
    var markerFill = parseInt(this.opt.marker.fill);
    var widthStep = this.markerWidthStep;
    var time = this.time;
    var markerW = 6;
    var transitionMs = this.opt.marker.transitionMs;
    var scaleThreshold = this.opt.annotationsUI.scaleThreshold;
    var lineFill = this.opt.marker.lineFill;
    var textFillAlt = this.opt.marker.textFillAlt;
    var textFillAltDark = this.opt.marker.textFillAltDark;

    var showAnnotation = (this.scale <= scaleThreshold && current.annotation);
    var showAnnotationImage = showAnnotation && current.annotation.sprite;

    flag.clear();
    marker.clear();

    var cx = pd[0];
    var cy = 0;
    var cw = pd[2];
    var ch = pd[3]
    var x = pd[0] + cw * time;
    var marginX = cw * 0.02;
    var marginY = cw * 0.008;

    var rectSmall = 0.3;
    var rectBig = 0.33;
    var rectW = cw * rectSmall;
    if (showAnnotation) rectW = cw * rectBig;
    var rectThreshold = cw * ((rectBig + rectSmall)/2);

    if (!this.markerRectW) this.markerRectW = rectW;
    if (this.markerRectW !== rectW) {
      var direction = rectW - this.markerRectW;
      direction /= Math.abs(direction);
      var rectWNew = this.markerRectW + (direction * widthStep);
      if (direction > 0 && rectWNew > rectW || direction < 0 && rectWNew < rectW) rectWNew = rectW;

      // delay the display of annotation
      if (direction > 0 && this.markerRectW < rectThreshold) {
        showAnnotation = false;
        showAnnotationImage = false;
      }

      this.markerTransitioning = true;
      this.markerRectW = rectWNew;
      rectW = rectWNew;
    } else {
      this.markerTransitioning = false;
    }

    var rectX = x + markerW/2;
    if (time > 0.5) {
      rectX = x - rectW - markerW/2;
    }

    // label bg
    var labelW = rectW - marginX * 2;
    var labelX = rectX + marginX;
    // var labelH = ch * 0.1;
    // marker.beginFill(0x777070, 0.2);
    // marker.drawRect(x, cy, labelW, labelH);
    // marker.endFill();

    marker.lineStyle(markerW, markerColor);
    marker.moveTo(x, cy).lineTo(x, cy + ch + pd[1]);

    var textStyle = this.markerTextStyle;
    var dc = UTIL.round(current.value, 1);
    var df = UTIL.round(current.valueF, 1);
    if (dc >= 0) {
      dc = "+" + dc;
      df = "+" + df;
    }

    var yearText = current.year;
    if (current.month >= 0) {
      yearText = MONTHS[current.month] + " " + parseInt(current.year);
    }

    var annotation = "";
    if (showAnnotation) annotation = current.annotation.text;

    // set text
    yLabel.text = yearText;
    cLabel.text = dc + "°C";
    fLabel.text = df + "°F";
    aLabel.text = annotation;
    var than = dc >= 0 ? "warmer": "cooler";
    lLabel.text = than + " than average"

    // set style
    yLabel.style = textStyle;
    textStyle = _.clone(textStyle);
    textStyle.fontSize *= 0.9;
    cLabel.style = textStyle;
    textStyle = _.clone(textStyle);
    textStyle.fill = textFillAltDark;
    fLabel.style = textStyle;
    textStyle.wordWrap = true;
    textStyle.wordWrapWidth = labelW;
    textStyle.fontSize *= 0.8;
    textStyle.fill = textFillAlt;
    aLabel.style = _.extend({}, textStyle, {lineHeight: textStyle.fontSize * 1.5});
    textStyle = _.clone(textStyle);
    textStyle.fontSize *= 0.9;
    textStyle.fill = textFillAltDark;
    lLabel.style = textStyle;

    // set x position
    yLabel.x = labelX;
    aLabel.x = labelX+ yLabel.width + marginX;
    cLabel.x = labelX;
    fLabel.x = labelX + cLabel.width + marginX;
    lLabel.x = labelX + cLabel.width + fLabel.width + marginX * 2;

    // set y position
    yLabel.y = cy + marginY * 1.5;
    aLabel.y = yLabel.y * 1.25;
    cLabel.y = yLabel.y + yLabel.height + marginY * 2;
    fLabel.y = cLabel.y;
    lLabel.y = cLabel.y  * 1.04;

    // draw rectangles
    var rectH = marginY * 5 + yLabel.height + cLabel.height;
    var imageW, imageH;
    var images = this.images;
    if (showAnnotationImage) {
      images.visible = true;
      for (var i=0; i<images.children.length; i++) {
        images.children[i].visible = false;
      }
      imageW = labelW;
      imageH = imageW / current.annotation.imageRatio;
      rectH += marginY + imageH;
      var sprite = current.annotation.sprite;
      sprite.width = imageW;
      sprite.height = imageH;
      sprite.visible = true;
      sprite.x = labelX;
      sprite.y = aLabel.y + aLabel.height + marginY;
    } else {
      images.visible = false;
    }

    var lineWidth = markerW*0.5;
    var cornerRadius = rectH * 0.1;
    var lineX = rectX - lineWidth/2;
    var lineY = cy + lineWidth/2;
    if (time > 0.5) lineX = rectX + lineWidth/2;
    flag.lineStyle(lineWidth, lineFill);
    flag.beginFill(markerFill);
    flag.moveTo(lineX, lineY).lineTo(lineX+rectW, lineY);
    if (time > 0.5) {
      flag.lineTo(lineX+rectW, lineY+rectH).lineTo(lineX+cornerRadius, lineY+rectH).lineTo(lineX, lineY+rectH-cornerRadius);
    } else {
      flag.lineTo(lineX+rectW, lineY+rectH-cornerRadius).lineTo(lineX+rectW-cornerRadius, lineY+rectH).lineTo(lineX, lineY+rectH);
    }
    flag.lineTo(lineX, lineY);
    // flag.drawRect(lineX, lineY, rectW, rectH);
    flag.endFill();

    // flag.beginFill(0x000000, 0.25);
    // flag.drawRect(rectX, cy + marginY + yLabel.height + marginY, rectW, cLabel.height + marginY * 3 + lLabel.height);
    // flag.endFill();

    // flag.lineStyle(1, 0x000000, 0.5);
    // flag.moveTo(labelX + labelW * 0.5, cLabel.y);
    // flag.lineTo(labelX + labelW * 0.5, cLabel.y+cLabel.height);

    this.prev = current;
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
    var labelCount = plot.children.length;
    var lineWidthBold = this.opt.yAxis.lineWidthBold;

    var monthTransitionValue = this.monthTransitionValue;
    var monthTransitioning = (monthTransitionValue > 0 && monthTransitionValue < 1);

    var cw = pd[2];
    var ch = pd[3];
    var dataW = cw / (domainp[1]-domainp[0]+1);
    if (monthTransitioning || isMonthView) {
      dataW = cw / (domainp[1]-domainp[0]+1.0/12.0) / 12.0;
    }

    var roundToNearest = 0.5;
    var dataMargin = Math.max(dataW * 0.05, roundToNearest);
    dataMargin = UTIL.ceilToNearest(dataMargin, roundToNearest);
    var mx0 = pd[0];
    var p0 = dataToPoint(domain[0], 0, domainp, range, pd); // baseline
    var y0 = p0[1];
    var leftBoundX = mx0-dataW;
    var rightBoundX = mx0+cw;

    plot.clear();

    var textStyle = _.extend(this.opt.plot.textStyle, {fontSize: dataW * 0.25});
    var labelIndex = 0;
    _.each(plotData, function(d, i){
      var value = d.value;
      var x = d.x;
      var y = d.y;
      var color = d.color;
      var p;
      if (x < leftBoundX || x > rightBoundX) return;

      if (monthTransitioning && d.month >= 0) {
        var yearValue = d.yearValue;
        value = UTIL.lerp(yearValue, value, monthTransitionValue);
        p = dataToPoint(d.year, value, domainp, range, pd);
        y = p[1];
        color = UTIL.lerpColor(d.yearColor, color, monthTransitionValue);
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
      var showLabel = true;
      // clip the sides off the edges
      if (x < mx0) {
        w -= (mx0 - x);
        x = mx0;
        showLabel = false;
      }
      if (x > (mx0 + cw - dataW)) {
        w -= (x - (mx0 + cw - dataW));
        showLabel = false;
      }
      plot.beginFill(color);

      var ry = y;
      var rh = y0 - y - lineWidthBold/2;
      if (y > y0) {
        ry = y0 + lineWidthBold/2;
        rh = y - ry;
      }

      if (rh > 0) {
        plot.drawRect(x+dataMargin, ry, w, rh);
        if (d.highlighting && d.highlightValue > 0 && d.highlightValue < 0.25) {
          var highlightValue = 1.0 - d.highlightValue * 4;
          plot.beginFill(0xFFFFFF, highlightValue*0.1);
          plot.drawRect(x+dataMargin, ry, w, rh);
        }
      }

      if (showLabel && (monthTransitioning || isMonthView) && d.month >= 0 && labelIndex < labelCount) {
        var label = plot.children[labelIndex];
        label.text = MONTHS[d.month];
        label.style = textStyle;
        label.x = x + dataW * 0.5;
        label.alpha = monthTransitionValue;
        if (y > y0) {
          label.y = y + dataMargin;
          label.anchor.set(0.5, 0);
        } else {
          label.y = ry - dataMargin;
          label.anchor.set(0.5, 1);
        }
        labelIndex += 1;
      }
    });

    // hide the remainder of labels
    if (labelIndex < labelCount) {
      for (var i=labelIndex; i<labelCount; i++) {
        plot.children[i].text="";
      }
    }
  };

  Graphics.prototype.renderTrend = function(){
    var domain = this.plotDomain;
    var count = domain[1]-domain[0];
    var tenYearTrendYearsDisplay = this.tenYearTrendYearsDisplay;
    var trend = this.trend;

    trend.clear();

    if (count < tenYearTrendYearsDisplay[0] || count > tenYearTrendYearsDisplay[1]) return false;

    var current = this.plotCurrentValue;
    var pd = this.plotDimensions;
    var domainp = this.plotDomainPrecise;
    var range = this.plotRange;
    var cw = pd[2];
    var ch = pd[3];
    var dataW = cw / (domainp[1]-domainp[0]+1);
    var plotData = this.plotData;
    var trendData = this.tenYearTrend;
    var annotationRanges = this.annotationRanges;
    var lineColor = parseInt(this.opt.trend.color);

    var findAnnotationRange = function(year, annotations){
      var found = _.find(annotations, function(a){ return year >= a.years[0] && year <= a.years[1]; });
      return found;
    };

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
        var annRange = findAnnotationRange(d.year, annotationRanges);
        if (annRange) {
          // highlight trend if we are currently on this annotation range
          if (current.year >= annRange.years[0] && current.year <= annRange.years[1]) {
            trend.lineStyle(4, lineColor, 0.8);

          // otherwise, just show it faintly
          } else {
            trend.lineStyle(2, 0xffffff, 0.4);
          }

        // don't show trend where there is no annotation range
        } else {
          trend.lineStyle(1, 0xffffff, 0);
        }
        trend.lineTo(x, y);
      }
    });
  };

  Graphics.prototype.sleepEnd = function(){
    if (this.sleeping) {
      this.sleepTransitionStart = new Date();
      this.sleepTransitioning = true;
      this.sleeping = false;
    }
  };

  Graphics.prototype.sleepStart = function(){
    this.sleepTransitionStart = new Date();
    this.sleepTransitioning = true;
    this.sleeping = true;
  };

  Graphics.prototype.sleepTransition = function(){
    var now = new Date();
    var transitionMs = this.sleepTransitionMs;
    var delta = now - this.sleepTransitionStart;
    var progress = delta / transitionMs;

    if (progress >= 1) {
      progress = 1.0;
      this.sleepTransitioning = false;
    }

    var alpha = 1.0 - progress;
    if (!this.sleeping) alpha = progress;

    if (this.restingFilter) {
      this.restingFilter.uniforms.progress = 1.0 - alpha;
    }


    _.each(this.sleepers, function(g){
      g.alpha = alpha;
    });
  };

  Graphics.prototype.transition = function(){
    this.monthTransitioning = (this.monthTransitionValue > 0 && this.monthTransitionValue < 1);

    if (!this.transitioning && !this.monthTransitioning && !this.markerTransitioning && !this.sleepTransitioning) return false;

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

    // sleep transition
    if (this.sleepTransitioning) {
      this.sleepTransition();
    }

    if (this.transitioning || this.monthTransitioning) {
      this.renderPlot();
      this.renderAnnotations();
    }

    if (this.markerTransitioning) {
      this.renderMarker();
    }
  };

  return Graphics;

})();
