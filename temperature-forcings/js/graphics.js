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

  function getIntersections(data, dy) {
    var intersections = [];
    var len = data.length - 1;
    _.each(data, function(y, i){
      if (i > 0) {
        var x = 1.0 * i / len;
        var prevX = 1.0 * (i-1) / len;
        var prevY = data[i-1];
        var a = {x: prevX, y: prevY};
        var b = {x: x, y: y};
        var c = {x: 0, y: dy};
        var d = {x: len, y: dy};
        var intersection = UTIL.lineIntersect(a, b, c, d);
        if (intersection) {
          intersections.push(intersection[0]);
        }
      }
    });
    return intersections;
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
    this.forcingsData = this.opt.data;
    this.forcingsContent = this.opt.forcings;
    this.transitionStep = this.opt.transitionStep;
    this.cordConfig = this.opt.cord;
    this.sleepTransitionMs = this.opt.sleepTransitionMs;

    // cord config details:
    // curveRatio: 0.45,
    // ampMin: 0.1, // min oscillation height in px
    // oscRange: [0.005, 0.01], // frequency / oscillation speed; lower means slower
    // tensityRange: [0.05, 0.1], // how tense the string is; lower means less tense
    // ampRange: [10, 50] // starting perpendicular height of oscillating string in px

    this.initForcings();

    this.cordsActive = false;
    this.plotActive = false;

    this.refreshDimensions();
    this.initCords();
    this.initView();
  };

  Graphics.prototype.initCords = function(){
    var tickEvery = this.opt.yAxis.tickEvery;
    var domain = this.domain;
    var range = this.range;
    var cordCount = parseInt(1.0*(range[1]-range[0])/tickEvery) + 1;
    var len = cordCount - 1;
    var bounds = this.plotDimensions;
    var oscRange = this.opt.cord.oscRange;
    var tensityRange = this.opt.cord.tensityRange;

    var cords = _.range(cordCount);
    cords = _.map(cords, function(i){
      var dy = i * tickEvery + range[0];
      var progress = i/len;
      var pp = dataToPercent(0, dy, domain, range);
      var p = dataToPoint(0, dy, domain, range, bounds);
      var freq = UTIL.lerp(oscRange[0], oscRange[1], progress);
      var tensity = UTIL.lerp(tensityRange[0], tensityRange[1], progress);
      return {
        i: i,
        y: p[1],
        py: pp[1],
        dy: dy,
        plucked: false,
        pluckedAt: false,
        amplitude: 0,
        frequency: freq,
        tensity: tensity
      }
    });
    this.cordStates = cords;
  };

  Graphics.prototype.initForcings = function(){
    var range = this.range;
    var incr = this.opt.yAxis.tickEvery;

    var forcingsColors = _.mapObject(this.forcingsContent, function(val, key){
      return parseInt("0x"+val.color.slice(1), 16);
    });

    this.forcingsState = _.mapObject(this.forcingsData, function(d, key) {
      // calculate intersections
      var intersections = [];
      var data = d.data;
      for (var dy=range[0]; dy<=range[1]; dy+=incr) {
        var cordIntersections = getIntersections(data, dy);
        intersections.push(cordIntersections);
      }
      // console.log(intersections)
      return {
        state: false,
        prevProgress: 0,
        progress: 0,
        intersections: intersections,
        color: forcingsColors[key],
        data: d.data
      };
    });


  };

  Graphics.prototype.initView = function(){
    this.app = new PIXI.Application(this.width, this.height, {backgroundColor : 0x000000, antialias: true});
    var axes = new PIXI.Graphics();
    var plot = new PIXI.Graphics();
    var cords = new PIXI.Graphics();
    var observed = new PIXI.Graphics();
    var combined = new PIXI.Graphics();

    this.app.stage.addChild(axes, observed, cords, plot, combined);

    // add label buffers to axes
    // increase this if you are getting "Cannot set property 'text' of undefined" error
    addLabelBuffers(observed, 1);
    addLabelBuffers(axes, 20);

    this.axes = axes;
    this.cords = cords;
    this.observed = observed;
    this.plot = plot;
    this.combined = combined;

    this.sleepers = [axes, cords, plot, observed.children[0]];
    this.dreamers = [combined];

    this.$el.append(this.app.view);

    this.renderAxes();
    this.renderObserved();
    this.renderPlot();
    this.renderCords();

    this.combined.alpha = 0;
    this.renderCombined();
  };

  Graphics.prototype.checkForPluck = function() {
    var _this = this;
    var data = this.forcingsData;
    var states = this.forcingsState;
    var domain = this.domain;
    var ampRange = this.opt.cord.ampRange;
    var cordStates = this.cordStates;

    _.each(states, function(s, key){
      var state = s.state;
      if (state !== false && state !== true && state > 0) {
        var curr = s.progress;
        var prev = s.prevProgress;
        var amp = UTIL.lerp(ampRange[0], ampRange[1], curr-prev);
        var intersections = s.intersections;

        // check to see if we crossed cords
        _.each(cordStates, function(c, j){
          var cIntersections = intersections[c.i];
          _.each(cIntersections, function(intersection){
            if (intersection > prev && intersection < curr) {
              _this.cordStates[c.i].plucked = true;
              _this.cordStates[c.i].pluckedAt = new Date();
              _this.cordStates[c.i].amplitude = amp;
              _this.cordsActive = true;
            }
          });
        });
      }
    });
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

    this.initCords();
    this.renderAxes();
    this.renderObserved();
    this.renderPlot();
    this.renderCords();
    this.renderCombined();
  };

  Graphics.prototype.pluck = function(){
    var _this = this;
    var cordStates = this.cordStates;
    var $document = $(document);

    _.each(cordStates, function(c, i){
      if (c.plucked) {
        $document.trigger("sound.play.percent", [c.py]);
        _this.cordStates[i].plucked = false;
      }
    });
  };

  Graphics.prototype.refreshDimensions = function(){
    var w = this.$el.width();
    var h = this.$el.height();

    this.width = w;
    this.height = h;

    var m = this.opt.margin.slice(0);
    m = [m[0]*h, m[1]*w, m[2]*h, m[3]*w];
    this.margin = m;

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
      this.checkForPluck();
      this.renderPlot();
    }

    if (this.cordsActive) {
      this.pluck();
      this.renderCords();
    }

    if (this.sleepTransitioning) {
      this.sleepTransition();
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
    var hotColor = parseInt(this.opt.yAxis.hotColor);
    var coolColor = parseInt(this.opt.yAxis.coolColor);

    axes.clear();

    var cx = pd[0];
    var cy = pd[1];
    var cw = pd[2];
    var ch = pd[3];

    axes.beginFill(0x151616);
    axes.drawRect(cx, cy, cw, ch);
    axes.endFill();

    // draw y axis
    // axes.lineStyle(1, 0xc4ced4);
    // axes.moveTo(cx, cy).lineTo(cx, cy + ch);

    var labelIndex = 0;
    var value = range[1];
    var tickEvery = this.opt.yAxis.tickEvery;
    var xLabel = cx - yAxisBounds[2] * 0.1667;
    var xLine = cx - yAxisBounds[2] * 0.1;
    var textColor = this.opt.yAxis.textStyle.fill;
    var xAxisVerticalCenter = xAxisBounds[0] * 0.85;
    var arrowLength = ch * 0.04;
    var arrowHeadW = ch * 0.02;
    var arrowHeadL = ch * 0.02;
    while(value >= range[0]) {
      var p = dataToPoint(0, value, domain, range, yAxisBounds);
      var y = p[1];

      var color = textColor;

      if (value === range[1]) {
        color = hotColor;
      }
      if (value === range[0]) {
        color = coolColor;
      }
      if (value === range[1] || value === range[0] || value === 0) {
        var text = "20th century";
        var subtext = "average";
        if (value !== 0) {
          text = UTIL.round(value, 1) + "°C";
          subtext = UTIL.round(value * 1.8, 1) + "°F";
        }
        if (value > 0) {
          text = "+" + text;
          subtext = "+" + subtext;
        }

        var label = axes.children[labelIndex];
        var sublabel = axes.children[labelIndex+1];
        labelIndex += 2;

        var style = _.extend({}, yAxisTextStyle, {fill: color});
        var subStyle = _.extend({}, yAxisSubtextStyle, {fill: color});
        if (value === 0.0) subStyle = _.extend({}, yAxisTextStyle, {fill: color});

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

      // draw warmer/color text

      if (value === range[0]/2 || value === range[1]/2) {
        var label = axes.children[labelIndex];
        labelIndex++;
        var color = hotColor;
        var text = "warmer";
        var yAdjust = y + arrowLength;

        if (value < 0) {
          color = coolColor;
          text = "cooler";
          yAdjust = y - arrowLength;
        }
        var style = _.extend({}, yAxisSubtextStyle, {fill: color});

        label.text = text;
        label.style = style;
        label.anchor.set(0.5, 0.5);
        label.x = xAxisVerticalCenter;
        label.y = yAdjust;
        label.rotation = -Math.PI / 2;

        var arrowW = 0.6;
        var arrowY = yAdjust - label.width * arrowW - arrowLength;
        if (value < 0) {
          arrowY = yAdjust + label.width * arrowW;
        }
        axes.lineStyle(3, color);
        axes.moveTo(xAxisVerticalCenter, arrowY).lineTo(xAxisVerticalCenter, arrowY+arrowLength);

        axes.lineStyle(0);
        axes.beginFill(color);
        if (value > 0) {
          axes.moveTo(xAxisVerticalCenter-arrowHeadW/2, arrowY).lineTo(xAxisVerticalCenter, arrowY-arrowHeadL).lineTo(xAxisVerticalCenter+arrowHeadW/2, arrowY);
        } else {
          axes.moveTo(xAxisVerticalCenter-arrowHeadW/2, arrowY+arrowLength).lineTo(xAxisVerticalCenter, arrowY+arrowLength+arrowHeadL).lineTo(xAxisVerticalCenter+arrowHeadW/2, arrowY+arrowLength);
        }
        axes.endFill();
      }

      // if (value === 0.0) axes.lineStyle(3, 0xffffff);
      // else axes.lineStyle(1, 0xffffff);
      // axes.moveTo(xLine, y).lineTo(cx, y);



      value -= tickEvery;
    }

    value = domain[0];
    var labelEvery = this.opt.xAxis.labelEvery;
    tickEvery = this.opt.xAxis.tickEvery;
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

        axes.lineStyle(1, 0x7f7f87);
        axes.moveTo(x, cy + ch).lineTo(x, yLine);
      }

      value ++;
    }

    // hide the remainder of labels
    for (var i=labelIndex; i<labelCount; i++) {
      axes.children[i].text="";
    }
  };

  Graphics.prototype.renderCombined = function(){
    var combined = this.combined;
    var forcing = _.extend({}, this.forcingsState["all"], {color: 0x058599});

    combined.clear();
    this.renderLine(combined, forcing, 1.0);
  };

  Graphics.prototype.renderCord = function(g, c){
    if (c.dy===0) g.lineStyle(4, 0xc4ced4);
    else g.lineStyle(3, 0x45474c, 0.5);

    // get plot bounds
    var pd = this.plotDimensions;
    var x0 = pd[0];
    var pw = pd[2];
    var ampMin = this.opt.cord.ampMin;

    // check if cord is oscillating
    var oscillating = false;

    // we are oscillating, draw curve
    if (c.amplitude > ampMin) {
      var d1 = new Date();
      var d0 = c.pluckedAt;
      var td = (d1 - d0) * c.frequency;
      var a = 2 * Math.PI * td;
      var ex = Math.exp(td * c.tensity); // exponential function; gets bigger over time
      var amp = c.amplitude / ex; // the current amplitude; gets smaller over time
      var yc = Math.cos(a) * amp; // the oscillating y-coordinate

      // set new amplitude
      this.cordStates[c.i].amplitude = amp;

      // build bezier curve
      var curveRatio = this.opt.cord.curveRatio;
      var xc = x0 + pw * 0.5;
      var dx = xc - x0;
      var dy = yc - c.y;
      var dxBez = curveRatio * Math.sqrt(dx * dx + dy * dy);

      // draw bezier curve
      g.moveTo(x0, c.y).bezierCurveTo(xc - dxBez, c.y + yc, xc + dxBez, c.y + yc, x0 + pw, c.y);

      this.cordsActive = true;

    // not oscillating, just draw a straight line
    } else {
      g.moveTo(x0, c.y).lineTo(x0 + pw, c.y);
    }

  };

  Graphics.prototype.renderLine = function(plot, forcing, progress){
    var domain = this.domain;
    var range = this.range;
    var pd = this.plotDimensions;
    var len = domain[1] - domain[0];
    var pointRadius = this.pointRadius;

    progress = progress || forcing.progress;
    var data = forcing.data;
    var color = forcing.color;

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
  };

  Graphics.prototype.renderCords = function(){
    var _this = this;
    var cords = this.cords;

    cords.clear();
    this.cordsActive = false;

    _.each(this.cordStates, function(c,i){
      _this.renderCord(cords, c);
    });
  };

  Graphics.prototype.renderObserved = function(){
    var _this = this;

    var data = this.observedData;
    var len = data.length;
    var range = this.range;
    var pd = this.plotDimensions;
    var observed = this.observed;
    var textStyle = _.extend({}, this.xAxisSubtextStyle, {wordWrap: true});
    var label = observed.children[0];

    var cx = pd[0];
    var cy = pd[1];
    var cw = pd[2];
    var ch = pd[3];

    observed.clear();

    var barW = cw / len;
    var rangeRatio = range[1] / (range[1]-range[0]);
    observed.lineStyle(1, 0x151616);

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

    // draw label
    var m = this.margin;
    label.text = this.opt.observedContent.label;
    textStyle.wordWrapWidth = m[1] * 0.95;
    label.style = textStyle;
    label.anchor.set(0, 0);
    label.x = cx + cw * 1.01;
    label.y = cy + ch * 0.3;
  };

  Graphics.prototype.renderPlot = function(){
    var _this = this;
    var forcingsState = this.forcingsState;
    var plot = this.plot;

    plot.clear();

    _.each(forcingsState, function(value, key){
      if (value.state !== false) {
        _this.renderLine(plot, value);
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

    _.each(this.sleepers, function(g){
      g.alpha = alpha;
    });

    _.each(this.dreamers, function(g){
      g.alpha = 1.0 - alpha;
    });
  };

  Graphics.prototype.transitionPlot = function(){
    var _this = this;
    var transitionStep = this.transitionStep;

    var plotActive = false;
    _.each(this.forcingsState, function(value, key){
      var state = value.state;
      var progress = value.progress;
      var prevProgress = progress;
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
      _this.forcingsState[key].prevProgress = prevProgress;
    });

    this.plotActive = plotActive;
  };

  return Graphics;

})();
