'use strict';

var Globe = (function() {
  function Globe(options) {
    var defaults = {
      el: '#globe',
      viewAngle: 45,
      near: 0.01,
      far: 1000,
      radius: 0.5,
      animationMs: 2000
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  function toSphere(lon, lat, radius) {
    var phi = (90-lat) * (Math.PI/180);
    var theta = (lon+180) * (Math.PI/180);
    var x = -(radius * Math.sin(phi) * Math.cos(theta));
    var y = (radius * Math.cos(phi));
    var z = (radius * Math.sin(phi) * Math.sin(theta));
    return [x, y, z];
  }

  Globe.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.slides = this.opt.slideshow.slice(0);

    this.slideCount = this.slides.length;
    this.currentSlide = 0;
    this.transitioning = false;

    this.initScene();
    this.loadEarth();
  };

  Globe.prototype.initScene = function() {
    var _this = this;
    var w = this.$el.width();
    var h = this.$el.height();
    var radius = this.opt.radius;

    // init renderer
    this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(w, h);
    this.$el.append(this.renderer.domElement);

    // init scene
    this.scene = new THREE.Scene();

    // init camera
    var viewAngle = this.opt.viewAngle;
    var aspect = w / h;
    var near = this.opt.near;
    var far = this.opt.far;
    this.camera = new THREE.PerspectiveCamera(viewAngle, w / h, near, far);
    this.camera.position.z = radius * 3.0;

    // ambient light
    var aLight = new THREE.AmbientLight(0x888888);
    this.scene.add(aLight);
  };

  Globe.prototype.loadEarth = function() {
    var _this = this;
    var radius = this.opt.radius;
    var color = this.opt.oceanColor;
    var scene = this.scene;

    // load image texture
    var loader = new THREE.TextureLoader();
    loader.load('img/world_map_blank_without_borders.png', function (texture) {
      // init globe
      var geo = new THREE.SphereGeometry(radius, 64, 64);
      var mat = new THREE.MeshBasicMaterial({map: texture, overdraw: true});
      var earth = new THREE.Mesh(geo, mat);
      earth.material.map.needsUpdate = true;
      scene.add(earth);
      _this.earth = earth;
      _this.loadMarker();
    });
  };

  Globe.prototype.loadMarker = function(){
    var slide = this.slides[this.currentSlide];

    var radius = this.opt.radius * 0.05;
    var color = this.opt.highlightColor;

    // init globe
    var geo = new THREE.SphereGeometry(radius, 64, 64);
    var mat = new THREE.MeshBasicMaterial({
      color: color
    });

    this.marker = new THREE.Mesh(geo, mat);
    this.earth.add(this.marker);

    this.updateMarker(slide);
    this.updateEarth(slide);
  };

  Globe.prototype.next = function(){
    if (this.transitioning) return false;

    this.currentSlide += 1;
    if (this.currentSlide >= this.slideCount) {
      this.currentSlide = 0;
    }

    var slide = this.slides[this.currentSlide];
    this.updateMarker(slide);
    this.updateEarth(slide);
  };

  Globe.prototype.onResize = function(){
    var w = this.$el.width();
    var h = this.$el.height();

    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  Globe.prototype.render = function(){
    // var animationMs = this.opt.animationMs;
    // var now = new Date();
    // var animationProgress = (now % animationMs) / animationMs;
    //
    // this.updateEarth(animationProgress);

    if (this.transitioning) {
      var now = new Date();
      var delta = now - this.transitionStart;
      var progress = delta / this.opt.animationMs;
      this.transitionEarth(progress);
    }

    this.renderer.render(this.scene, this.camera);
  };

  Globe.prototype.transitionEarth = function(progress) {
    if (progress > 1.0) {
      progress = 1.0;
      this.transitioning = false;
    }

    var qtemp = new THREE.Quaternion();
    THREE.Quaternion.slerp(this.qstart, this.qend, qtemp, progress);
    this.earth.quaternion.copy(qtemp);
  }

  Globe.prototype.updateEarth = function(slide){
    var earth = this.earth;
    var phi = slide.lat * (Math.PI/180);
    var lon = 270 - slide.lon;
    var theta = lon * (Math.PI/180);

    var euler = new THREE.Euler(phi, theta, 0, 'XYZ');

    // rotation (using slerp)
    // https://stackoverflow.com/questions/35465654/rotating-a-sphere-to-a-specific-point-not-the-camera
    var qstart = new THREE.Quaternion().copy(earth.quaternion); // src quaternion
    var qend = new THREE.Quaternion().setFromEuler(euler); //dst quaternion

    this.transitioning = true;
    this.transitionStart = new Date();
    this.qstart = qstart;
    this.qend = qend;
  };

  Globe.prototype.updateMarker = function(slide){
    var p = toSphere(slide.lon, slide.lat, this.opt.radius);
    this.marker.position.set(p[0], p[1], p[2]);
  };

  return Globe;

})();
