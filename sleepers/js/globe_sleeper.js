'use strict';

var GlobeSleeper = (function() {

  function GlobeSleeper(options) {
    var defaults = {
      "textureFile": "img/world_map_blank_without_borders.png",
      "viewAngle": 45,
      "near": 0.01,
      "far": 1000,
      "radius": 0.5,
      "distance": 1.5,
      "rotateY": 0,
      "className": "sleeper globe-sleeper"
    };
    options = _.extend({}, defaults, options);
    Sleeper.call(this, options);
  }

  // inherit from Sleeper
  GlobeSleeper.prototype = Object.create(Sleeper.prototype);
  GlobeSleeper.prototype.constructor = GlobeSleeper;

  GlobeSleeper.prototype.loadView = function(){
    var $el = $('<div class="'+this.opt.className+' '+this.opt.position+'"></div>');

    var _this = this;
    var w = this.width;
    var h = this.height;
    var radius = this.opt.radius;

    // init renderer
    var renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(w, h);
    $el.append(renderer.domElement);

    // init scene
    var scene = new THREE.Scene();

    // init camera
    var viewAngle = this.opt.viewAngle;
    var aspect = w / h;
    var near = this.opt.near;
    var far = this.opt.far;
    var camera = new THREE.PerspectiveCamera(viewAngle, w / h, near, far);
    camera.position.z = this.opt.distance;

    // ambient light
    var aLight = new THREE.AmbientLight(0x888888);
    scene.add(aLight);

    // rotaters
    var container = new THREE.Object3D();
    container.rotation.z = -23.43703 * Math.PI / 180;
    var xContainer = new THREE.Object3D();
    var yContainer = new THREE.Object3D();
    yContainer.rotation.x = this.opt.rotateY * Math.PI / 180;
    yContainer.add(xContainer);
    container.add(yContainer);
    scene.add(container);

    // globe
    var loader = new THREE.TextureLoader();
    loader.load(this.opt.textureFile, function (texture) {
      var geo = new THREE.SphereGeometry(radius, 64, 64);
      var mat = new THREE.MeshBasicMaterial({map: texture});
      var earth = new THREE.Mesh(geo, mat);
      earth.material.map.needsUpdate = true;
      xContainer.add(earth);
      _this.earth = earth;
      _this.dataLoaded = true;
    });

    this.$parent.prepend($el);
    this.$el = $el;
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.xContainer = xContainer;
  };

  GlobeSleeper.prototype.onResize = function(){
    this.refreshDimensions();

    var w = this.width;
    var h = this.height;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  GlobeSleeper.prototype.renderGraphics = function(progress, alpha){
    if (!this.dataLoaded) return false;

    var angle = progress * 360;
    this.xContainer.rotation.y = angle * Math.PI / 180;

    this.renderer.render(this.scene, this.camera);
  };

  return GlobeSleeper;

})();
