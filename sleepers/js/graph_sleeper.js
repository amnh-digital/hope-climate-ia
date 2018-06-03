'use strict';

var GraphSleeper = (function() {

  function GraphSleeper(options) {
    var defaults = {
      "dataFile": "data/co2.json"
    };
    options = _.extend({}, defaults, options);
    Sleeper.call(this, options);
  }

  // inherit from Sleeper
  GraphSleeper.prototype = Object.create(Sleeper.prototype);
  GraphSleeper.prototype.constructor = GraphSleeper;

  GraphSleeper.prototype.loadData = function(){
    var _this = this;
    this.dataLoaded = false;

    $.getJSON(this.opt.dataFile, function(data){
      _this.onDataLoaded(data);
    });
  };

  GraphSleeper.onDataLoaded = function(data){
    this.data = data;
    this.yearCount = data.length;
    this.dataLoaded = true;
  };

  GraphSleeper.prototype.renderGraphics = function(progress){
    if (!this.dataLoaded) return false;


  };

  return GraphSleeper;

})();
