'use strict';

var Globe = (function() {
  function Globe(options) {
    var defaults = {
      el: '#globe',
      viewAngle: 45,
      near: 0.01,
      far: 1000,
      radius: 0.5,
      animationMs: 2000,
      animationDelayMs: 500
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

    this.initScene();
    this.loadEarth();
    this.loadGeojson(this.opt.geojson);
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
    this.camera.position.z = radius * 4.0;

    // ambient light
    var aLight = new THREE.AmbientLight(0x888888);
    this.scene.add(aLight);
  };

  Globe.prototype.loadEarth = function() {
    var radius = this.opt.radius;
    var oceanColor = this.opt.oceanColor;

    // init globe
    var geo = new THREE.SphereGeometry(radius, 64, 64);
    var mat = new THREE.MeshBasicMaterial({
      color: oceanColor
    });

    this.earth = new THREE.Mesh(geo, mat);
    // this.earth.rotation.y = -Math.PI/2;
  };

  Globe.prototype.loadGeojson = function(geojsonData){
    var opt = {
      color: this.opt.borderColor
    };
    var radius = this.opt.radius * 1.001;

    drawThreeGeo(geojsonData, radius, 'sphere', opt, this.scene);
  };

  Globe.prototype.next = function(){

  };

  Globe.prototype.onResize = function(){
    var w = this.$el.width();
    var h = this.$el.height();

    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  Globe.prototype.render = function(){
    var animationMs = this.opt.animationMs;
    var now = new Date();
    var animationProgress = (now % animationMs) / animationMs;

    this.updateEarth(animationProgress);

    this.renderer.render(this.scene, this.camera);
  };

  Globe.prototype.updateEarth = function(yearProgress){

  };

  return Globe;

})();
