'use strict';

var GamepadViz = (function() {

  function GamepadViz(config) {
    var defaults = {
      windowSize: 2
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  function getSmoothedValue(value, dataWindow, windowSize) {
    var threshold = 0.001;
    var dataWindowLen = dataWindow.length;
    if (dataWindowLen < windowSize) {
      dataWindow.push(value);
      return {
        value: value,
        dataWindow: dataWindow
      }
    }

    var previous = dataWindow[0];
    var current = dataWindow[1];
    var next = value;

    var delta1 = current - previous;
    var delta2 = current - next;
    var adelta1 = Math.abs(delta1);
    var adelta2 = Math.abs(delta2);
    var sign1 = 0;
    var sign2 = 0;
    if (adelta1 > 0) sign1 = delta1 / adelta1;
    if (adelta2 > 0) sign2 = delta2 / adelta2;

    var newWindow = [current, next];

    // we've hit an anomaly, take the average of the previous and next
    if (sign1===sign2 && adelta1 > threshold && adelta2 > threshold) {
      current = (previous + next) / 2.0;
      newWindow[0] = current;
    }

    return {
      value: current,
      dataWindow: newWindow
    };
  }

  function norm(value, a, b){
    return (1.0 * value - a) / (b - a);
  };

  GamepadViz.prototype.init = function(){
    this.$raw = $('#raw');
    this.$smoothed = $('#smoothed');
    this.$step = $('#step');
    this.$value = $('#value');
    this.$valueSmoothed = $('#value-smoothed');
    this.speed = 1;

    this.loadData($("#select-data").val());
    this.loadListeners();
  };

  GamepadViz.prototype.loadData = function(datafile){
    var _this = this;

    $.getJSON(datafile, function(data) {
      _this.onDataLoaded(data);
    });
  };

  GamepadViz.prototype.loadListeners = function(){
    var _this = this;

    $("#speed").on('input', function(e){
      _this.speed = $(this).val() / 100.0;
    });

    $("#select-data").on('change', function(e){
      _this.loadData($(this).val());
    });
  };

  GamepadViz.prototype.onDataLoaded = function(data){
    var windowSize = this.opt.windowSize;
    var dataLen = data.length;
    var dataWindow = [];

    this.data = _.map(data, function(value, i){
      var rawLeft = norm(value, -1, 1) * 100;

      var smoothed = getSmoothedValue(value, dataWindow, windowSize);
      dataWindow = smoothed.dataWindow.slice(0);

      var smoothedLeft = norm(smoothed.value, -1, 1) * 100;
      return {
        raw: value,
        rawLeft: rawLeft,
        smoothed: smoothed.value,
        smoothedLeft: smoothedLeft
      };
    });

    this.dataLen = data.length;
    this.index = 0;

    if (!this.rendering) {
      this.rendering = true;
      this.render();
    }
  };

  GamepadViz.prototype.render = function(){
    var _this = this;

    var index = this.index;
    var i = parseInt(Math.round(index));
    var d = this.data[i];

    this.$step.text(i);
    this.$value.text(d.raw);
    this.$valueSmoothed.text(d.smoothed);

    this.$raw.css('left', d.rawLeft+'%');
    this.$smoothed.css('left', d.smoothedLeft+'%');

    index += this.speed;
    if (index >= this.dataLen-0.5) index = 0;
    this.index = index;

    requestAnimationFrame(function(){ _this.render(); });
  };

  return GamepadViz;

})();

var app = new GamepadViz({});
