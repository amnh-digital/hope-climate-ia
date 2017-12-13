'use strict';

var Sound = (function() {
  function Sound(options) {
    var defaults = {};
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  Sound.prototype.init = function(){

  };

  Sound.prototype.load = function(){
    var deferred = $.Deferred();

    setTimeout(function(){
      console.log("Sounds loaded.");
      deferred.resolve();
    }, 500);

    return deferred.promise();
  };

  return Sound;

})();
