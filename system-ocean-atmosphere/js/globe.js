'use strict';

var Globe = (function() {
  function Globe(options) {
    var defaults = {
      el: '#globe',
      viewAngle: 45,
      near: 0.01,
      far: 1000,
      radius: 0.5,
      videoOffset: 0.0,
      opacityStep: 1.0,
      positionStep: 1.0
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  function lonLatToVector3(lng, lat, radius) {
    var out = new THREE.Vector3();

    lng = UTIL.radians(lng);
    lat = UTIL.radians(lat);

    //flips the Y axis
    lat = Math.PI / 2 - lat;

    // distribute to sphere
    out.set(
      Math.sin(lat) * Math.sin(lng) * radius,
      Math.cos(lat) * radius,
      Math.sin(lat) * Math.cos(lng) * radius
    );

    return out;
  }

  // http://stackoverflow.com/questions/27409074
  function objectToScreen(obj, camera, w, h){
    var v3 = new THREE.Vector3();
    var hw = w / 2;
    var hh = h / 2;

    camera.updateMatrixWorld();
    obj.updateMatrixWorld();
    v3.setFromMatrixPosition(obj.matrixWorld);
    v3.project(camera);

    var x = (v3.x * hw) + hw;
    var y = (-v3.y * hh) + hh;

    return new THREE.Vector2(x, y);
  }

  function v3ToScreen(v3, camera, w, h){
    var hw = w / 2;
    var hh = h / 2;

    camera.updateMatrixWorld();
    v3.project(camera);

    var x = (v3.x * hw) + hw;
    var y = (-v3.y * hh) + hh;

    return new THREE.Vector2(x, y);
  }

  Globe.prototype.init = function(){
    var el = this.opt.el;
    this.$document = $(document);
    this.$el = $(el);
    this.$el.append($(this.opt.title));

    this.rotateX = 0.5;
    this.rotateY = 0.5;
    this.annotations = _.where(this.opt.annotations, {globeEl: el});
    this.video = this.opt.video;

    this.initScene();
    this.loadAnnotation();
    this.loadAnnotations();
    this.loadGeojson(this.opt.geojson);
    this.loadEarth();
    this.loadEarthResting();

    this.onRotate("vertical", this.rotateY);
    this.onRotate("horizontal", this.rotateX);
  };

  Globe.prototype.initScene = function() {
    var _this = this;
    var w = parseInt(this.$el.width());
    var h = parseInt(this.$el.height());
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
    this.camera.position.z = radius * 3.5;

    // master container, rotate to the angle of the Earth's tilt
    this.container = new THREE.Object3D();
    this.container.rotation.z = -23.43703 * Math.PI / 180;

    // containers for x and y rotations
    this.xContainer = new THREE.Object3D();
    this.yContainer = new THREE.Object3D();

    this.yContainer.add(this.xContainer);
    this.container.add(this.yContainer);
    this.scene.add(this.container);

    this.origin = new THREE.Vector3(0,0,0);

    // init controls
    // this.controls = new THREE.OrbitControls(this.camera, $("#globes")[0]);
  };

  Globe.prototype.ended = function(){
    return this.video.ended;
  };

  Globe.prototype.getProgress = function(){
    var progress = 0;
    var video = this.video;
    if (video && video.duration) {
      progress = video.currentTime / video.duration;
    }
    return progress;
  };

  Globe.prototype.isTransitioning = function(){};

  Globe.prototype.isLoaded = function(){
    return this.video && this.video.duration;
  };

  Globe.prototype.loadAnnotation = function(){
    var radius = this.opt.radius;
    var circleOpacity = this.opt.circleOpacity;
    var material = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 4, opacity: circleOpacity, transparent: true});
    var geometry = new THREE.CircleGeometry(radius, 64);
    geometry.vertices.shift(); // remove the center
    geometry.vertices.push(geometry.vertices[0]); // close the loop

    this.annotationAnchor = new THREE.Object3D();
    // this.annotationAnchor = new THREE.Mesh(new THREE.SphereGeometry(0.01, 64, 64), new THREE.MeshBasicMaterial());
    this.annotationAnchor.position.set(radius, 0, 0);

    this.annotationCircle = new THREE.Line(geometry, material);
    this.annotationCircle.scale.set(0.1, 0.1, 0.1);

    this.annotationCircle.add(this.annotationAnchor);

    this.xContainer.add(this.annotationCircle);
  };

  Globe.prototype.loadAnnotations = function(){
    var annotations = this.annotations;

    var radius = this.opt.radius;
    var markerOpacity = this.opt.markerOpacity;
    var markerRadius = radius * 0.03;
    var distance = radius * 1.1;
    var container = this.xContainer;
    var origin = this.origin;
    var markerColor = parseInt(this.opt.markerColor);

    this.annotations = _.map(annotations, function(a, i){
      var geometry = new THREE.ConeBufferGeometry(markerRadius, markerRadius*2, 8);
      geometry.rotateX(Math.PI / 2)
      var material = new THREE.MeshBasicMaterial({color: markerColor, opacity: markerOpacity, transparent: true});
      var marker = new THREE.Mesh(geometry, material);
      marker.position.copy(lonLatToVector3(a.lon, a.lat, distance));
      // marker.rotation.x = Math.PI / 2;
      marker.lookAt(origin);
      container.add(marker);
      a.marker = marker;
      return a;
    });
  };

  Globe.prototype.loadEarth = function() {
    var radius = this.opt.radius;

    // load video texture
    var tex = new THREE.VideoTexture(this.video);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.format = THREE.RGBFormat;
    tex.repeat.set(1, 0.5);
    tex.offset.set(0, this.opt.videoOffset);
    // tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    // init globe
    var geo = new THREE.SphereGeometry(radius, 64, 64);
    var mat = new THREE.MeshBasicMaterial({map: tex, overdraw: true});
    var earth = new THREE.Mesh(geo, mat);

    earth.material.map.needsUpdate = true;
    earth.rotation.y = -Math.PI/2;

    // add north arrow
    var dir = new THREE.Vector3(0, 1, 0);
    var origin = new THREE.Vector3(0, 0, 0);
    var length = radius * 1.45;
    var hex = parseInt(this.opt.arrowColor);
    var northArrow = new THREE.ArrowHelper(dir, origin, length, hex);
    earth.add(northArrow);

    // add south arrow
    dir = new THREE.Vector3(0, -1, 0);
    var southArrow = new THREE.ArrowHelper(dir, origin, length, hex);
    earth.add(southArrow);

    this.xContainer.add(earth);

    this.earth = earth;
    this.northArrow = northArrow;
    this.southArrow = southArrow;
  };

  Globe.prototype.loadEarthResting = function(){
    var _this = this;
    var radius = this.opt.radius * 1.01;
    var xContainer = this.xContainer;

    // load image texture
    var loader = new THREE.TextureLoader();
    loader.load('img/world_map_blank_without_borders.png', function (texture) {
      // init globe
      var geo = new THREE.SphereGeometry(radius, 64, 64);
      var mat = new THREE.MeshBasicMaterial({map: texture, overdraw: true, transparent: true, opacity: 0.0});
      var earth = new THREE.Mesh(geo, mat);
      earth.material.map.needsUpdate = true;
      earth.rotation.y = -Math.PI/2 + (2/9);
      xContainer.add(earth);
      _this.earthResting = earth;
    });
  };

  Globe.prototype.loadGeojson = function(geojsonData){
    var opt = {
      color: this.opt.geojsonLineColor
    };
    var radius = this.opt.radius * 1.001;

    drawThreeGeo(geojsonData, radius, 'sphere', opt, this.xContainer);
  };

  Globe.prototype.onResize = function(){
    var w = parseInt(this.$el.width());
    var h = parseInt(this.$el.height());

    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  Globe.prototype.onRotate = function(axis, value){
    var container;
    var range;
    var angle;

    if (axis === "vertical") {
      this.rotateY = value;
      container = this.yContainer;
      range = this.opt.rotateY;
      angle = UTIL.lerp(range[0], range[1], 1.0-value);
      container.rotation.x = angle * Math.PI / 180;

    } else {
      this.rotateX = value;
      container = this.xContainer;
      range = this.opt.rotateX;
      angle = UTIL.lerp(range[0], range[1], value);
      container.rotation.y = angle * Math.PI / 180;
    }

    if (this.currentAnnotation) {
      this.renderAnnotation();
    }
  };

  Globe.prototype.render = function(yearProgress){

    // if (this.isTransitioning()) {
    //
    // }

    if (this.sleepTransitioning) {
      this.sleepTransition();
    }

    this.renderer.render(this.scene, this.camera);
    // this.controls.update();
  };

  Globe.prototype.renderAnnotation = function(){
    if (!this.currentAnnotation) return false;

    this.scene.updateMatrixWorld();
    // var v3 = this.annotationAnchor.localToWorld(new THREE.Vector3(0,0,0));
    var w = this.renderer.context.canvas.width;
    var h = this.renderer.context.canvas.height;
    var v2 = objectToScreen(this.annotationAnchor, this.camera, w, h);
    // var v2 = v3ToScreen(v3, this.camera, w, h);
    this.$document.trigger("annotation.position.update", [this.opt.el, v2.x, v2.y]);
  };

  Globe.prototype.sleepEnd = function(){
    if (this.sleeping) {
      this.sleepTransitionStart = new Date();
      this.sleepTransitioning = true;
      this.sleeping = false;

      var color = new THREE.Color(parseInt(this.opt.arrowColor));
      this.northArrow.setColor(color);
      this.southArrow.setColor(color);
    }
  };

  Globe.prototype.sleepStart = function(){
    this.sleepTransitionStart = new Date();
    this.sleepTransitioning = true;
    this.sleeping = true;

    var color = new THREE.Color(parseInt(this.opt.restingColor));
    this.northArrow.setColor(color);
    this.southArrow.setColor(color);
  };

  Globe.prototype.sleepTransition = function(){
    var now = new Date();
    var transitionMs = this.opt.sleepTransitionMs;
    var delta = now - this.sleepTransitionStart;
    var progress = delta / transitionMs;
    var markerOpacity = this.opt.markerOpacity;
    var circleOpacity = this.opt.circleOpacity;

    if (progress >= 1) {
      progress = 1.0;
      this.sleepTransitioning = false;
    }

    var alpha = progress;
    if (!this.sleeping) alpha = 1.0 - progress;

    this.earthResting.material.opacity = alpha;

    _.each(this.annotations, function(a){
      a.marker.material.opacity = (1.0 - alpha) * markerOpacity;
    });

    this.annotationCircle.material.opacity = (1.0 - alpha) * circleOpacity;
  };

  Globe.prototype.updateAnnotation = function(annotation){
    if (annotation && annotation.globeEl !== this.opt.el
      || annotation && !annotation.arrow) return false;

    // // prep transition properties
    // if (this.currentAnnotation) {
    //   annotation.currentLon = this.currentAnnotation.currentLon;
    //   annotation.currentLat = this.currentAnnotation.currentLat;
    //   annotation.currentOpacity = this.currentAnnotation.currentOpacity;
    // } else {
    //   annotation.currentLon = annotation.lon;
    //   annotation.currentLat = annotation.lat;
    //   annotation.currentOpacity = 0;
    // }

    this.currentAnnotation = annotation;

    // show/hide markers
    var marker = false;
    if (annotation) {
      var a = _.findWhere(this.annotations, {id: annotation.id});
      if (a) marker = a.marker;
    }
    if (this.currentMarker) this.currentMarker.visible = true;
    this.currentMarker = marker;
    if (marker) marker.visible = false;

    if (annotation) {
      var radius = this.opt.radius;
      var lat = annotation.lat;
      var lon = annotation.lon;
      var arrow = annotation.arrow;
      var arrowRadius = arrow.radius || 0.3;
      var arrowDistance = arrow.distance || 1.0;
      this.annotationCircle.scale.set(arrowRadius, arrowRadius, arrowRadius);
      var v3 = lonLatToVector3(lon, lat, this.opt.radius * arrowDistance);
      this.annotationCircle.position.copy(v3);
      this.annotationCircle.lookAt(this.origin);

      var arrowRadius = radius;
      if (arrow.anchor[0] <= 0) arrowRadius = -radius;
      this.annotationAnchor.position.set(arrowRadius, 0, 0);

    // hide annotation circle
    } else {
      this.annotationCircle.scale.set(0.001, 0.001, 0.001);
      this.annotationCircle.position.set(0,0,0);
    }
    this.renderAnnotation();
  };

  return Globe;

})();
