'use strict';

var AppOceanAtmosphere = (function() {

  function AppOceanAtmosphere(config, content, data) {
    var defaults = {};
    this.opt = _.extend({}, defaults, config);
    this.content = content;
    this.data = data;

    this.init();
  }

  // convert 0-360 to -180-180
  function normLon(deg){
    // wrap around
    if (deg > 360) deg = (deg-360);
    if (deg < 0) deg = 360 + deg;
    if (deg > 180) return (deg - 360);
    else return deg;
  }

  AppOceanAtmosphere.prototype.init = function(){
    var _this = this;
    var videoPromise = this.loadVideo();

    this.rotateX = 0.5;
    this.rotateY = 0.5;
    this.content.annotations = this.loadAnnotations();

    $.when(videoPromise).done(function(resp){
      _this.onReady();
    });
  };

  AppOceanAtmosphere.prototype.loadAnnotations = function(){
    var globeOpt = this.opt.globe;
    var canvasW = globeOpt.bgWidth;
    var canvasH = globeOpt.bgHeight;
    var annotationLatThreshold = globeOpt.annotationLatThreshold;
    var annotationLonThreshold = globeOpt.annotationLonThreshold;

    var annotations = _.map(this.content.annotations, function(a, i){
      var copy = _.clone(a);

      copy.index = i;
      copy.id = ""+i;

      var lonThreshold = a.lonThreshold || annotationLonThreshold;
      var latThreshold = a.latThreshold || annotationLatThreshold;

      copy.latFrom = a.lat - latThreshold;
      copy.latTo = a.lat + latThreshold;
      copy.lonFrom = a.lon - lonThreshold;
      copy.lonTo = a.lon + lonThreshold;
      // Note where x = 0px, lon = -90
      // where y = 0px, lat = 90
      var lw = a.width;
      var lh = a.height;
      var lx = a.lon;
      var ly = a.lat;
      if (lw && lh) {
        var w = lw/360.0 * canvasW;
        var h = lh/180.0 * canvasH;
        lx = a.lon - lw * 0.5;
        ly = a.lat + lh * 0.5;
        copy.width = w;
        copy.height = h;
      }
      if (lx < -90) lx = 270 - (-lx - 90);

      copy.x = UTIL.norm(lx, -90, 270) * canvasW;
      copy.y = UTIL.norm(ly, 90, -90) * canvasH;

      return copy;
    });

    return annotations;
  };

  AppOceanAtmosphere.prototype.loadControls = function(){
    var _this = this;

    var controls = new Controls(this.opt.controls);

    return controls.load();
  };

  AppOceanAtmosphere.prototype.loadListeners = function(){
    var _this = this;
    var $document = $(document);
    var $window = $(window);

    var onAxisChange = function(resp) {
      var key = resp.key;
      var value = resp.value;
      switch(key) {
        case "horizontal":
          _this.onRotate("horizontal", value);
          break;
        case "vertical":
          _this.onRotate("vertical", value);
          break;
        default:
          break;
      }
    }
    var channel = new Channel(this.opt.controls.channel, {"role": "subscriber"});
    channel.addCallback("controls.axes.change", onAxisChange);
    channel.listen();

    var onAnnotationPositionUpdate = function(e, el, x, y){ _this.onAnnotationPositionUpdate(el, x, y); };
    $document.on("annotation.position.update", onAnnotationPositionUpdate);

    var onSleepStart = function(e, value) { _this.onSleepStart(); };
    var onSleepEnd = function(e, value) { _this.onSleepEnd(); };
    $document.on("sleep.start", onSleepStart);
    $document.on("sleep.end", onSleepEnd);

    var onResize = function(){ _this.onResize(); };
    $window.on('resize', onResize);
  };

  AppOceanAtmosphere.prototype.loadVideo = function(){
    var _this = this;
    var promise = $.Deferred();

    // add video element to document
    var $video = $('<video id="video" webkit-playsinline style="display: none" autoplay loop crossorigin="anonymous"></video>');
    _.each(this.opt.videos, function(v){
      var rand = "?r=" + parseInt(Math.random() * 100000); // add random string at the end to prevent cache
      $video.append($('<source src="'+v.url+rand+'" type="'+v.type+'">'));
    });
    $('body').append($video);
    this.video = $video[0];

    // wait for video to load, then load earth
    this.video.addEventListener('loadeddata', function() {
      console.log('Video loaded');
      promise.resolve();
    }, false);

    return promise;
  };

  AppOceanAtmosphere.prototype.onAnnotationPositionUpdate = function(el, x, y){
    this.contentObj.onAnnotationPositionUpdate(el, x, y);
  };

  AppOceanAtmosphere.prototype.onReady = function(){
    this.colorKey = new ColorKey(this.opt.colorKey);

    var globes = [];
    var globeOpt = this.opt.globe;
    var globesOpt = this.opt.globes;
    var content = this.content;
    var annotations = this.content.annotations;
    var video = this.video;

    _.each(globesOpt, function(opt){
      var globe = _.extend({}, opt, {
        currentAnnotation: false,
        currentAnnotationId: false,
        obj: new Globe(_.extend({}, opt, globeOpt, content, {video: video}))
      })
      globes.push(globe);
    });

    this.globes = globes;
    this.calendar = new Calendar(_.extend({}, this.opt.calendar));
    this.contentObj = new Content(_.extend({}, this.content));

    // Init sleep mode utilitys
    this.sleep = new Sleep(_.extend({}, this.opt.sleep));

    this.loadListeners();
    this.loadControls();

    this.render();
  };

  AppOceanAtmosphere.prototype.onResize = function(){
    _.each(this.globes, function(globe){
      globe.obj.onResize();
    });
    this.contentObj.onResize();
    this.calendar.onResize();
  };

  AppOceanAtmosphere.prototype.onRotate = function(axis, value){
    this.sleep.wakeUp();

    var _this = this;
    if (axis === "vertical")  this.rotateY = value;
    else this.rotateX = value;

    // look for active annotations
    var globeOpt = this.opt.globe;
    var lonRange = globeOpt.rotateX;
    var lon = UTIL.lerp(lonRange[0], lonRange[1], 1.0-this.rotateX);
    lon = normLon(lon);

    var latRange = globeOpt.rotateY;
    var lat = UTIL.lerp(90, -90, this.rotateY);

    var annotations = _.filter(this.content.annotations, function(a){
      return lon >= a.lonFrom && lon <= a.lonTo && lat >= a.latFrom && lat <= a.latTo;
    });
    // console.log(annotations)

    // multiple found, sort by distance
    if (annotations.length > 1) {
      annotations = _.sortBy(annotations, function(a){
        return Math.abs(lon-a.lon);
      });
    }

    var globes = this.globes;
    _.each(globes, function(globe, i){
      var globeAnnotations = _.filter(annotations, function(a){ return a.globeEl===globe.el; });
      var globeAnnotation = false;
      var globeAnnotationId = false;
      // found annotation
      if (globeAnnotations.length > 0) {
        globeAnnotation = globeAnnotations[0];
      }

      // check if we changed annotation
      if (globeAnnotation) globeAnnotationId = globeAnnotation.id;
      var changed = (globeAnnotationId !== globe.currentAnnotationId);
      if (changed) {
        _this.contentObj.update(globe.el, globeAnnotation);
        globes[i].currentAnnotationId = globeAnnotationId;
        globes[i].currentAnnotation = globeAnnotation;
        globe.obj.updateAnnotation(globeAnnotation);
      }

      globe.obj.onRotate(axis, value);
    });
  };

  AppOceanAtmosphere.prototype.onSleepEnd = function(){
    _.each(this.globes, function(globe){
      globe.obj.sleepEnd();
    });
  };

  AppOceanAtmosphere.prototype.onSleepStart = function(){
    _.each(this.globes, function(globe){
      globe.obj.sleepStart();
    });
  };

  AppOceanAtmosphere.prototype.render = function(){
    var _this = this;

    var globeTest = this.globes[0];
    var yearProgress = globeTest.obj.getProgress();

    _.each(this.globes, function(globe){
      globe.obj.render();
    });

    this.calendar.render(yearProgress);

    requestAnimationFrame(function(){ _this.render(); });
  };

  return AppOceanAtmosphere;

})();
