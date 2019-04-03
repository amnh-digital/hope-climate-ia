'use strict';

var GamepadUtility = (function() {

  function GamepadUtility(config) {
    var defaults = {
      listEl: "#slider-list",
      maxGamepads: 4,
      maxAxes: 2
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  function norm(value, a, b){
    return (1.0 * value - a) / (b - a);
  };

  GamepadUtility.prototype.init = function(){
    this.loadGamepads();
    this.loadUI();
    this.loadListeners();
    this.pollGamepads();
  };

  GamepadUtility.prototype.loadGamepad = function(data, i){
    console.log('Found gamepad', data, i);
    var gp = this.gamepads[i];
    var $el = gp.$el;

    $el.html('<h2>'+data.id+' <button data-index="'+i+'" class="button-save">Save</button></h2>');

    var $axesList = $('<ol></ol>');
    var axesCount = data.axes.length;
    var maxAxes = this.opt.maxAxes;
    axesCount = Math.min(axesCount, maxAxes);

    var axes = [];
    for (var j=0; j<axesCount; j++) {
      var value = data.axes[j];
      var $axis = $('<li></li>');
      var $min = $('<span class="min">'+value+'</span>');
      var $max = $('<span class="max">'+value+'</span>');
      var $current = $('<span class="current">'+value+'</span>');
      var $bar = $('<div class="bar"></div>');
      var $checkbox = $('<label><input type="checkbox" title="reversed?" /> reverse?</label>');
      var $button = $('<button class="button-record" data-gamepad="'+i+'" data-axis="'+j+'">record</button>')
      $axis.append($min);
      $axis.append($current);
      $axis.append($max);
      $axis.append($bar);
      $axis.append($checkbox);
      $axis.append($button);
      $axesList.append($axis);
      axes.push({
        index: j,
        $current: $current,
        $min: $min,
        $max: $max,
        $bar: $bar,
        $checkbox: $checkbox,
        $button: $button,
        value: value,
        min: value,
        max: value
      });
    }

    $el.append($axesList);
    this.gamepads[i].axes = axes;
  };

  GamepadUtility.prototype.loadGamepads = function(){
    var maxGamepads = this.opt.maxGamepads;
    this.gamepads = _.times(this.opt.maxGamepads, function(i){
      return {
        "loaded": false
      }
    });
  };

  GamepadUtility.prototype.loadListeners = function(){
    var _this = this;

    $('body').on('click', '.button-save', function(e){
      var i = parseInt($(this).attr('data-index'));
      _this.save(i);
    });

    $('body').on('click', '.button-record', function(e){
      var i = parseInt($(this).attr('data-gamepad'));
      var j = parseInt($(this).attr('data-axis'));
      var text = $(this).text();
      if (text==="record") {
        _this.record(i, j);
        $(this).text("stop");
      } else {
        _this.saveRecord(i, j);
        $(this).text("record");
      }

    });
  };

  GamepadUtility.prototype.loadUI = function(){
    var maxGamepads = this.opt.maxGamepads;
    var $listEl = $(this.opt.listEl);

    var gamepads = this.gamepads;
    for(var i=0; i<maxGamepads; i++) {
      var $el = $("<li>n/a</li>");
      $listEl.append($el);
      gamepads[i].$el = $el;
    }
  };

  GamepadUtility.prototype.pollGamepads = function(){
    var _this = this;
    var gamepads = navigator.getGamepads();

    // none found, keep listening
    if (!gamepads || !gamepads.length) {
      requestAnimationFrame(function(){ _this.pollGamepads(); });
      return false;
    }

    // look for gamepads
    var maxGamepads = this.opt.maxGamepads;
    for(var i=0; i<maxGamepads; i++) {
      _this.renderGamepad(gamepads[i], i);
    }

    requestAnimationFrame(function(){ _this.pollGamepads(); });
  };

  GamepadUtility.prototype.record = function(i, j){
    this.recording = true;
    this.recordingData = [];
    this.recordGamepad = i;
    this.recordAxis = j;
  }

  GamepadUtility.prototype.renderGamepad = function(gamepadData, i){
    var _this = this;
    var gp = this.gamepads[i];
    var $el = gp.$el;

    if (!gamepadData) {
      $el.text('n/a');
      return false;
    }

    // load gamepad for the first time
    if (!gp.loaded) {
      this.loadGamepad(gamepadData, i);
      this.gamepads[i].loaded = true;
    }

    var recordingData = this.recordingData;
    var recordGamepad = this.recordGamepad;
    var recordAxis = this.recordAxis;
    var recording = this.recording && (recordGamepad===i);

    var axes = gp.axes;
    var axesData = gamepadData.axes;
    var axesCount = axes.length;
    var maxAxes = this.opt.maxAxes;
    axesCount = Math.min(axesCount, maxAxes);
    for (var j=0; j<axesCount; j++) {
      var axis = axes[j];
      var value = axesData[j];
      if (recording && recordAxis===j) {
        recordingData.push(value);
        if (recordingData.length > 100000) {
          recordingData = recordingData.slice(1);
        }
      }
      var percent = norm(value, -1, 1) * 100;
      axes[j].$bar.css('width', percent+"%");
      axes[j].value = value;
      axes[j].$current.html(value);
      if (value > axis.max) {
        axes[j].max = value;
        axes[j].$max.html(value);
      }
      if (value < axis.min) {
        axes[j].min = value;
        axes[j].$min.html(value);
      }
    }

  };

  GamepadUtility.prototype.save = function(i){
    var gp = this.gamepads[i];
    var postData = _.map(gp.axes, function(a){
      var swapped = a.$checkbox[0].checked;
      var min = a.min;
      var max = a.max;
      if (swapped) {
        var temp = min;
        min = max;
        max = temp;
      }
      return {
        "min": min,
        "max": max
      };
    });
    postData = {
      "filename": "./controls.json",
      "data": {
        "gamepad": {
          "axes": postData
        }
      }
    }

    console.log('Saving config', postData);
    $.post('/config/save', postData, function(data){
      console.log(data);
      alert('Config saved!');
    });
  }

  GamepadUtility.prototype.saveRecord = function(i, j){
    this.recording = false;
    var dataObjectString = JSON.stringify(this.recordingData);
    console.log(dataObjectString);
  }

  return GamepadUtility;

})();

var app = new GamepadUtility({});
