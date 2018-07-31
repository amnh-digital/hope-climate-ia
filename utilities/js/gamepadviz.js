'use strict';

var GamepadViz = (function() {

  function GamepadViz(config) {
    var defaults = {
      windowSize: 60
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  function add(a, b) {
    return a + b;
  }

  function mean(values) {
    var len = values.length;
    if (len <= 0) return 0;
    var sum = values.reduce(add, 0);
    return sum/len;
  }

  function filterOutliers(someArray) {

    // Copy the values, rather than operating on references to existing values
    var values = someArray.concat();
    var vlen = values.length;

    // Then sort
    values.sort( function(a, b) {
      return a - b;
    });

    /* Then find a generous IQR. This is generous because if (values.length / 4)
     * is not an int, then really you should average the two elements on either
     * side to find q1.
     */
    var q1 = values[Math.floor((vlen / 4))];
    // Likewise for q3.
    var q3 = values[Math.ceil((vlen * (3 / 4)))];
    var iqr = q3 - q1;

    // Then find min and max values
    var margin = 1.5;
    var maxValue = q3 + iqr*margin;
    var minValue = q1 - iqr*margin;

    // Then filter anything beyond or beneath these values.
    var filteredValues = values.filter(function(x) {
      return (x <= maxValue) && (x >= minValue);
    });

    // Then return
    return filteredValues;
  }

  function getSmoothedValue(value, dataWindow, windowSize) {
    dataWindow.push(value);
    var dataWindowLen = dataWindow.length;

    // only smooth if we have enough data points
    if (dataWindowLen >= windowSize) {
      // slice to windown size
      if (dataWindowLen > windowSize) dataWindow = dataWindow.slice(1);
      // remove outliers
      var filteredDataWindow = filterOutliers(dataWindow);
      // calculate mean
      value = mean(filteredDataWindow);

    // don't return value until we have enough data
    } else {
      value = 0;
    }

    return {
      value: value,
      dataWindow: dataWindow
    }
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
