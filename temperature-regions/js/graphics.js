'use strict';

var Graphics = (function() {
  var isAccessibleText = false;

  function Graphics(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

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

  function lerpData(d1, d2, amount){
    var d1v = _.map(d1, function(d){ return d[0]; });
    var d2v = _.map(d2, function(d){ return d[0]; });
    var dv = UTIL.lerpList(d1v, d2v, amount);
    var dc = [];
    if (amount < 0.5) dc = _.map(d1, function(d){ return d[1]; });
    else dc = _.map(d2, function(d){ return d[1]; });
    return _.zip(dv, dc);
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

    isAccessibleText = this.opt.accessibleText;

    this.domain = this.opt.domain;
    this.range = this.opt.range;
    this.zoneData = this.opt.zoneData;
    this.plotData = [];

    this.time = this.opt.time;
    this.zone = this.opt.zone;

    this.refreshDimensions();
    this.initView();
    this.renderAxes();
    this.onZoneChange(this.zone);

    if (isAccessibleText) {
      var _this = this;
      setTimeout(function(){
        _this.renderAxes();
        _this.renderMarker();
      }, 100);
    }
  };

  Graphics.prototype.initView = function(){
    this.app = new PIXI.Application(this.width, this.height, {backgroundColor : 0x000000, antialias: true});
    var axes = new PIXI.Graphics();
    var plot = new PIXI.Graphics();
    var marker = new PIXI.Graphics();

    this.app.stage.addChild(axes, plot, marker);

    this.$el.append(this.app.view);

    // add label buffers to axes
    // increase this if you are getting "Cannot set property 'text' of undefined" error
    addLabelBuffers(this.app.view, axes, 20);
    addLabelBuffers(this.app.view, marker, 3);

    this.axes = axes;
    this.plot = plot;
    this.marker = marker;
  };

  Graphics.prototype.onResize = function(){
    this.refreshDimensions();
    this.app.renderer.resize(this.width, this.height);

    this.renderAxes();
    this.renderPlot();
    this.renderMarker();
  };

  Graphics.prototype.onTimeChange = function(time){
    this.time = time;
    this.renderMarker();
  };

  Graphics.prototype.onZoneChange = function(zone){
    var data = this.zoneData;
    var dataLen = data.length;
    if (dataLen <= 0) return false;

    var p = zone * (dataLen-1);
    var i = Math.round(zone * (dataLen-1));
    var diff = p - i;

    if (Math.abs(diff) > 0) {
      var d1 = false;
      var d2 = false;
      var amount = 0;

      if (diff < 0 && i > 0) {
        amount = UTIL.norm(diff, -0.5, 0);
        d1 = data[i-1];
        d2 = data[i];
      } else if (diff > 0 && i < dataLen-1) {
        amount = UTIL.norm(diff, 0, 5);
        d1 = data[i];
        d2 = data[i+1];
      }

      if (d1 && d2) {
        this.plotData = lerpData(d1, d2, amount);
      } else {
        this.plotData = data[i];
      }

    } else {
      this.plotData = data[i];
    }

    this.zone = zone;
    this.renderPlot();
    this.renderMarker();
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
    this.renderAxes();
    this.renderPlot();
    this.renderMarker();
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
    var plotLineColor = parseInt(this.opt.plotLineColor);
    var tickColor = parseInt(this.opt.xAxis.tickColor);

    var axes = this.axes;
    var labelCount = axes.children.length;
    var labelIndex = 0;
    var label;

    // clear axes
    axes.clear();

    axes.beginFill(parseInt(this.opt.plotBGColor));
    axes.drawRect(pd[0], pd[1], pd[2], pd[3]);
    axes.endFill();

    // draw y axis
    // axes.lineStyle(2, 0x2c2d2d);
    // axes.moveTo(pd[0], pd[1]).lineTo(pd[0], pd[1]+pd[3]);

    // draw horizontal lines
    var v = range[0];
    var yStep = 0.5;
    while (v <= range[1]) {
      var p = dataToPoint(0, v, domain, range, pd);
      var xLabel = pd[0] * 0.9;
      var y = p[1];

      // draw label
      if (v%1===0) {
        // draw line
        if (v!=0) axes.lineStyle(1, plotLineColor);
        else axes.lineStyle(2, plotLineColor);
        axes.moveTo(pd[0], p[1]).lineTo(pd[0]+pd[2], p[1]);

        if (v===0) {
          label = axes.children[labelIndex];
          label.text = "1901–2000";
          label.style = yAxisSubtextStyle;
          label.x = xLabel;
          label.y = y;
          label.anchor.set(1.0, 1.0);
          labelIndex++;

          label = axes.children[labelIndex];
          label.text = "average";
          label.style = yAxisSubtextStyle;
          label.x = xLabel;
          label.y = y;
          label.anchor.set(1.0, 0);
          labelIndex++;
        } else {

          var dc = v;
          var df = Math.round(v * 1.8);
          // var text = dc + '°C (' + df + '°F)';
          var text = dc + '°C';
          if (v > 0) text = "+"+text;
          label = axes.children[labelIndex];
          label.text = text;
          label.style = yAxisTextStyle;
          label.x = xLabel;
          label.y = y;
          label.anchor.set(1, 0.5);
          labelIndex++;
        }

      }

      v += yStep;
    }

    // draw x axis
    v = domain[0];
    var tickEvery = 10;
    var yLabel = xAxisBounds[1] * 1.12;
    axes.lineStyle(1, tickColor);
    while (v <= domain[1]) {
      var showLabel = (v===domain[1] || v===domain[0]);
      var showTick = (v%tickEvery===0 || v===domain[1] || v===domain[0]);
      var px, p;
      if (showLabel || showTick) {
        p = dataToPoint(v, range[0], domain, range, pd);
      }
      // draw label
      if (showLabel) {
        label = axes.children[labelIndex];
        var ax = 0.5;
        // if (v===domain[0]) ax = 0;
        // else if (v===domain[1]) ax = 1;
        label.text = v;
        label.style = xAxisTextStyle;
        label.x = p[0];
        label.y = yLabel;
        label.anchor.set(ax, 1);
        labelIndex++;
      }
      if (showTick) {
        axes.moveTo(p[0], p[1]).lineTo(p[0], yLabel * 0.92);
      }
      v++;
    }

    // hide the remainder of labels
    for (var i=labelIndex; i<labelCount; i++) {
      axes.children[i].text="";
    }
  };

  Graphics.prototype.renderMarker = function(){
    // draw plot marker
    var pd = this.plotDimensions;
    var marker = this.marker;
    var labelYear = marker.children[0];
    var labelC = marker.children[1];
    var labelF = marker.children[2];

    marker.clear();

    var cx = pd[0];
    var cy = pd[1];
    var cw = pd[2];
    var ch = pd[3];
    var x = cx + cw * this.time;
    var marginX = cw * 0.01;

    var zones = this.zoneData.length;
    var zoneData = this.zoneData[Math.round((zones-1) * this.zone)]
    var domain = this.domain;
    var year = Math.round(UTIL.lerp(domain[0], domain[1], this.time))
    var yearIndex = year - domain[0];
    var value = zoneData[yearIndex][0];
    var color = zoneData[yearIndex][1];
    var lineColor = parseInt(this.opt.marker.color);
    // console.log(year, value, color);

    marker.lineStyle(3, lineColor, 0.8);
    marker.moveTo(x, cy).lineTo(x, cy + ch);

    var textStyle = _.clone(this.markerTextStyle);
    var ly = cy * 0.8;
    var padding = 0.01;

    labelYear.text = year;
    labelYear.style = textStyle;
    labelYear.x = x * (1-padding);
    labelYear.y = ly;
    labelYear.anchor.set(1, 1);

    var dc = UTIL.round(value, 1);
    var df = UTIL.round(value * 1.8, 1);
    if (value > 0){
      df = "+" + df;
      dc = "+" + dc;
    }
    var textC = dc + "°C";
    var textF = df + "°F"
    textStyle.fill = color;
    textStyle.fontSize *= 0.9;

    labelC.text = textC;
    labelC.style = textStyle;
    labelC.x = x * (1+padding);
    labelC.y = ly;
    labelC.anchor.set(0, 1);

    textStyle.fill = this.opt.marker.altColor;
    labelF.text = textF;
    labelF.style = textStyle;
    labelF.x = labelC.x + labelC.width + padding + 1;
    labelF.y = ly;
    labelF.anchor.set(0, 1);

    var lw = labelYear.width;
    var lw2 = labelC.width + padding + 1 + labelF.width;
    var left = x - cx;
    var right = cw + cx - x;

    if (lw > left) {
      var delta = lw - left;
      labelYear.x += delta;
      labelC.x += delta;
      labelF.x += delta;

    } else if (lw2 > right) {
      var delta = lw2 - right;
      labelYear.x -= delta;
      labelC.x -= delta;
      labelF.x -= delta;
    }
  };

  Graphics.prototype.renderPlot = function(){
    var _this = this;

    var data = this.plotData;
    var len = data.length;
    var range = this.range;
    var pd = this.plotDimensions;
    var plot = this.plot;

    var cx = pd[0];
    var cy = pd[1];
    var cw = pd[2];
    var ch = pd[3];

    plot.clear();

    var barW = cw / len;
    var rangeRatio = range[1] / (range[1]-range[0]);
    // plot.lineStyle(1, 0x212121);

    _.each(data, function(d, i){
      var value = d[0];
      var color = d[1];
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

      plot.beginFill(color);
      plot.drawRect(x, y, barW, barH);
    });
  };

  return Graphics;

})();
