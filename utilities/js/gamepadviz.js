'use strict';

var GamepadViz = (function() {

  function GamepadViz(config) {
    var defaults = {
      "dataFile": "data/sample.json"
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
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

    this.loadData(this.opt.dataFile);
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
    this.data = _.map(data, function(value){
      var rawLeft = norm(value, -1, 1) * 100;
      var smoothed = +value.toFixed(2);
      var smoothedLeft = norm(smoothed, -1, 1) * 100;
      return {
        raw: value,
        rawLeft: rawLeft,
        smoothed: smoothed,
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
