'use strict';

var AppRegions = (function() {

  function AppRegions(config, content, data) {
    var defaults = {};
    this.opt = _.extend({}, defaults, config);
    this.content = content;
    this.data = data;

    this.init();
  }

  AppRegions.prototype.init = function(){
    this.loadControls();
    this.onReady();
  };

  AppRegions.prototype.loadControls = function(){
    var _this = this;

    var controls = new Controls(this.opt.controls);

    return controls.load();
  };

  AppRegions.prototype.loadListeners = function(){
    var _this = this;

    var onAxisChange = function(resp) {
      var key = resp.key;
      var value = resp.value;
      switch(key) {
        case "horizontal":
          _this.onTimeChange(value);
          break;
        case "vertical":
          _this.onZoneChange(1.0-value);
          break;
        default:
          break;
      }
    }
    var channel = new Channel(this.opt.controls.channel, {"role": "subscriber"});
    channel.addCallback("controls.axes.change", onAxisChange);
    channel.listen();

    // $(document).on("sleep.start", function(e, value) {
    //   _this.sleepStart();
    // });
    //
    // $(document).on("sleep.end", function(e, value) {
    //   _this.sleepEnd();
    // });

    $(window).on('resize', function(){
      _this.onResize();
    });

  };

  AppRegions.prototype.onReady = function(){
    var d = this.data;

    var opt = _.extend({}, this.opt.graphics, this.data);

    // Initialize viz
    this.graphics = new Graphics(opt);

    opt = _.extend({}, this.opt.map, this.data, this.content, {zone: this.opt.graphics.zone, time: this.opt.graphics.time});
    this.map = new Map(opt);

    opt = _.extend({}, this.opt.messages, this.content, {zone: this.opt.graphics.zone, time: this.opt.graphics.time});
    this.messages = new Messages(opt);

    // Init sleep mode utilitys
    this.sleep = false;
    if (this.opt.sleep.enable) {
      opt = _.extend({}, this.opt.sleep);
      this.sleep = new Sleep(opt);
    }

    this.loadListeners();
  };

  AppRegions.prototype.onResize = function(){
    this.graphics.onResize();
    this.map.onResize();
  };

  AppRegions.prototype.onTimeChange = function(value) {
    this.graphics.onTimeChange(value);
    this.map.onTimeChange(value);
    this.sleep && this.sleep.wakeUp();
  };

  AppRegions.prototype.onZoneChange = function(value) {
    this.graphics.onZoneChange(value);
    this.map.onZoneChange(value);
    this.messages.onZoneChange(value);
    this.sleep && this.sleep.wakeUp();
  };

  return AppRegions;

})();
