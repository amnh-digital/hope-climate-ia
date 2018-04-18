'use strict';

var Content = (function() {
  function Content(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Content.prototype.init = function(){
    this.annotations = this.opt.annotations.slice(0);
    this.markers = {};

    this.loadMarkers();
    this.loadUI();
  };

  Content.prototype.loadMarker = function(globeEl){
    var _this = this;
    var $el = $(globeEl);
    var w = $el.width();
    var h = $el.height();
    var app = new PIXI.Application(w, h, {transparent: true, antialias: true});
    var marker = new PIXI.Graphics();
    app.stage.addChild(marker);
    $el.append(app.view);
    this.markers[globeEl] = {
      "$el": $el,
      "app": app,
      "graphics": marker,
      "bb": $el[0].getBoundingClientRect()
    };
  };

  Content.prototype.loadMarkers = function(){
    var _this = this;
    var globeEls = _.pluck(this.annotations, "globeEl");
    globeEls = _.uniq(globeEls);

    _.each(globeEls, function(globeEl){
      _this.loadMarker(globeEl);
    });
  };

  Content.prototype.loadUI = function(){
    var _this = this;

    _.each(this.annotations, function(a, i){
      var $container = $(a.parentEl);
      var $els = [];
      _.each(a.els, function(el, j){
        var $annotation = $('<div id="'+el.id+'" class="annotation"></div>');
        if (el.className) $annotation.addClass(el.className);
        if (el.title) $annotation.append('<h3>'+el.title+'</h3>');
        if (el.image) $annotation.append('<img src="'+el.image+'" alt="'+el.imageAlt+'" />');
        if (el.text) $annotation.append('<p>'+el.text+'</p>');
        $container.append($annotation);
        $els.push($annotation)
      });

      _this.annotations[i].$els = $els;
      // calculations for arrows
      _this.annotations[i].bb = $els[0][0].getBoundingClientRect();
    });
  };

  Content.prototype.onAnnotationPositionUpdate = function(el, x, y){
    var m = this.markers[el];
    var graphics = m.graphics;
    var annotation = this.currentAnnotation;

    graphics.clear();
    if (m.active && annotation && annotation.arrow) {
      var aBB = annotation.bb;
      var mBB = m.bb;

      var y0 = (aBB.y+aBB.height*0.5) - mBB.y;
      var x0 = (aBB.x+aBB.width*1.1) - mBB.x;

      if (annotation.arrowAnchor==="left") {
        x0 = (aBB.x*0.97) - mBB.x;
      }

      graphics.lineStyle(4, 0xffffff,  0.25);
      graphics.moveTo(x0, y0);
      graphics.lineTo(x, y);
    }
  };

  Content.prototype.onResize = function(){
    var _this = this;

    _.each(this.markers, function(marker, key){
      var w = marker.$el.width();
      var h = marker.$el.height();
      marker.app.renderer.resize(w, h);
      _this.markers[key].bb = marker.$el[0].getBoundingClientRect();
    });

    _.each(this.annotations, function(a, i){
      _this.annotations[i].bb = a.$els[0][0].getBoundingClientRect();
    });
  };

  Content.prototype.update = function(annotation){
    var _this = this;
    $(".annotation").removeClass('active');

    _.each(this.markers, function(m, key){
      var active = (annotation && annotation.globeEl===key);
      if (!active) m.graphics.clear();
      _this.markers[key].active = active;
    });

    if (!annotation) {
      this.currentAnnotation = false;
      return false;
    }

    var i = annotation.index;
    this.currentAnnotation = this.annotations[i];
    _.each(this.currentAnnotation.$els, function($el,i){
      $el.addClass('active');
    });
  };

  return Content;

})();
