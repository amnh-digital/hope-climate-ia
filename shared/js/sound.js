'use strict';

var Sound = (function() {
  function Sound(options) {
    var defaults = {
      "enable": 1,
      "volume": 0.4,
      "limitLastPlayedMs": 10
    };
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  Sound.prototype.init = function(){
    this.enabled = this.opt.enable;
    this.limitLastPlayedMs = this.opt.limitLastPlayedMs;
    this.lastPlayed = new Date();
  };

  Sound.prototype.load = function(){
    if (!this.enabled) return false;

    var deferred = $.Deferred();
    var _this = this;

    var sprites = this.opt.sprites;
    this.sound = new Howl({
      src: this.opt.audio,
      sprite: sprites,
      volume: this.opt.volume
    });
    this.notes = _.keys(sprites);

    this.sound.once('load', function(){
      console.log("Sound loaded.");
      _this.loadListeners();
      deferred.resolve();
    });

    return deferred.promise();
  };

  Sound.prototype.loadListeners = function(){
    var _this = this;
    var playPercent = function(e, value){
      _this.playPercent(value);
    };

    $(document).on("sound.play.percent", playPercent);
  };

  Sound.prototype.playPercent = function(percent){
    if (percent < 0 || percent > 1) return false;

    // limit many sounds played at once
    var now = new Date();
    var lastPlayed = this.lastPlayed;
    if (now - lastPlayed < this.limitLastPlayedMs) return false;

    var len = this.notes.length;
    var i = Math.floor((len - 1) * percent);
    var sprite = this.notes[i];
    this.sound.play(sprite);
    this.lastPlayed = now;
  };

  return Sound;

})();
