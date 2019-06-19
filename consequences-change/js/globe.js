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
    // make slight adjustment; lat/lon is slightly off for some reason
    lon -= 8;
    lat += 5;

    // account for earth being an ellipsoid
    // https://stackoverflow.com/questions/10473852/convert-latitude-and-longitude-to-point-in-3d-space
    var F = 1.0 / 298.257223563; // Flattening factor WGS84 Model
    var FF = (1.0-F) * (1.0-F);
    var C = 1.0 / Math.sqrt(Math.cos(lat) * Math.cos(lat) + Math.sin(lat) * Math.sin(lat) * FF);
    var S = C * FF;

    var phi = (90-lat) * (Math.PI/180);
    var theta = (lon+180) * (Math.PI/180);
    var x = -((radius * C) * Math.sin(phi) * Math.cos(theta));
    var y = ((radius * C) * Math.cos(phi));
    var z = ((radius * S) * Math.sin(phi) * Math.sin(theta));
    return [x, y, z];
  }

  Globe.prototype.init = function(){
    this.$el = $(this.opt.el);

    this.initScene();
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
    var promise = $.Deferred();

    // load image texture
    var loader = new THREE.TextureLoader();
    var ASSET_URL = ASSET_URL || '';
    loader.load(ASSET_URL+'img/world_map_blank_without_borders.png', function (texture) {
      // init globe
      var geo = new THREE.SphereGeometry(radius, 64, 64);
      var mat = new THREE.MeshBasicMaterial({map: texture, overdraw: true});
      var earth = new THREE.Mesh(geo, mat);
      earth.material.map.needsUpdate = true;
      scene.add(earth);
      _this.earth = earth;
      _this.loadMarker();
      _this.render();

      console.log("Globe loaded");
      promise.resolve();
    });

    return promise;
  };

  Globe.prototype.loadMarker = function(){
    var radius = this.opt.radius * 0.04;
    var color = this.opt.highlightColor;

    // init globe
    var geo = new THREE.SphereGeometry(radius, 64, 64);
    var mat = new THREE.MeshBasicMaterial({
      color: color
    });

    this.marker = new THREE.Mesh(geo, mat);
    this.earth.add(this.marker);

    // var slide = this.opt.slideshow[0];
    // this.updateMarker(slide);
    // this.updateEarth(slide);
  };

  Globe.prototype.next = function(slide){
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

    // if (this.transitioning) {
    //   var now = new Date();
    //   var delta = now - this.transitionStart;
    //   var progress = delta / this.opt.animationMs;
    //   this.transitionEarth(progress);
    // }

    this.renderer.render(this.scene, this.camera);
  };

  Globe.prototype.transitionEarth = function(progress) {
    var qtemp = new THREE.Quaternion();
    THREE.Quaternion.slerp(this.qstart, this.qend, qtemp, progress);
    this.earth.quaternion.copy(qtemp);
  }

  Globe.prototype.updateEarth = function(slide){
    var earth = this.earth;
    var phi = slide.lat * (Math.PI/180);
    var lon = 280 - slide.lon;
    var theta = lon * (Math.PI/180);

    var euler = new THREE.Euler(phi, theta, 0, 'XYZ');

    // rotation (using slerp)
    // https://stackoverflow.com/questions/35465654/rotating-a-sphere-to-a-specific-point-not-the-camera
    var qstart = new THREE.Quaternion().copy(earth.quaternion); // src quaternion
    var qend = new THREE.Quaternion().setFromEuler(euler); //dst quaternion

    this.qstart = qstart;
    this.qend = qend;
  };

  Globe.prototype.updateMarker = function(slide){
    var p = toSphere(slide.lon, slide.lat, this.opt.radius);
    this.marker.position.set(p[0], p[1], p[2]);
  };

  return Globe;

})();
