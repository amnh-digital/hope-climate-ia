'use strict';

var GraphSleeper = (function() {

  function GraphSleeper(options) {
    var defaults = {
      "dataFile": "data/slr.json",
      "color": 0x272a2b
    };
    options = _.extend({}, defaults, options);
    Sleeper.call(this, options);
  }

  // inherit from Sleeper
  GraphSleeper.prototype = Object.create(Sleeper.prototype);
  GraphSleeper.prototype.constructor = GraphSleeper;

  GraphSleeper.prototype.loadData = function(){
    var _this = this;

    $.getJSON(this.opt.dataFile, function(data){
      _this.onDataLoaded(data);
    });
  };

  GraphSleeper.prototype.onDataLoaded = function(data){
    this.data = data;
    this.yearCount = data.length;
    this.dataLoaded = true;

    this.refreshGraphDimensions();
  };

  GraphSleeper.prototype.onResize = function(){
    this.refreshDimensions();
    this.refreshGraphDimensions();
    this.app.renderer.resize(this.width, this.height);
  };

  GraphSleeper.prototype.refreshGraphDimensions = function(){
    var x0 = 0;
    var x1 = this.width;
    var y0 = 0;
    var y1 = this.height;

    this.graphData = _.map(this.data, function(year, i){
      var yearData = _.map(year, function(d, j){
        var x = UTIL.lerp(x0, x1, d[0]);
        var y = UTIL.lerp(y1, y0, d[1]);
        return {
          x: x,
          y: y
        }
      });
      return yearData;
    });
  };

  GraphSleeper.prototype.renderGraphics = function(progress, alpha){
    if (!this.dataLoaded) return false;

    var x0 = 0;
    var x1 = this.width;
    var y0 = 0;
    var y1 = this.height;

    // load graphics
    var g = this.graphics;
    g.clear();
    g.beginFill(this.opt.color);
    g.alpha = alpha;

    // determine years
    var yearCount = this.yearCount;
    var yearDec = (yearCount-1) * progress;
    var yearFrom = parseInt(yearDec);
    var yearTo = yearFrom + 1;
    var yearProgress = yearDec - yearFrom;

    // interpolate between years
    var dataFrom = this.graphData[yearFrom];
    var dataTo = this.graphData[yearTo];
    var lerpedData = _.map(dataFrom, function(a, i){
      var b = dataTo[i];
      return {
        x: UTIL.lerp(a.x, b.x, yearProgress),
        y: UTIL.lerp(a.y, b.y, yearProgress)
      }
    });

    // start on the bottom left
    g.moveTo(x0, y1);
    g.lineTo(x0, lerpedData[0].y);

    _.each(lerpedData, function(p, i){
      g.lineTo(p.x, p.y);
    });

    // move to bottom right and back to origin
    g.lineTo(x1, lerpedData[lerpedData.length-1].y);
    g.lineTo(x1, y1);
    g.moveTo(x0, y1);
    g.endFill();
  };

  return GraphSleeper;

})();
