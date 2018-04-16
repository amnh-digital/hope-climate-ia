'use strict';

var AppCascading = (function() {

  function AppCascading(config, content, data) {
    var defaults = {};
    this.opt = _.extend({}, defaults, config);
    this.content = content;
    this.data = data;

    this.init();
  }

  AppCascading.prototype.init = function(){
    var _this = this;

    var controlPromise = this.loadControls();
    var soundPromise = this.loadSounds();
    var assetPromise = this.loadAssets();

    $.when.apply($, [controlPromise, soundPromise, assetPromise]).then(function(){
      _this.onReady();
      _this.loadListeners();
    });
  };

  AppCascading.prototype.loadAssets = function(){
    var _this = this;
    var deferred = $.Deferred();
    var loader = new PIXI.loaders.Loader();

    // get image paths from content
    var network = this.content.network;
    var imagePaths = ['img/placeholder.png'];
    _.each(network, function(branch, i){
      _.each(branch.nodes, function(node, j){
        if (node.image) imagePaths.push(node.image);
      });
    });

    // load images
    imagePaths = _.uniq(imagePaths);
    var imageIndex = {};
    _.each(imagePaths, function(path){
      var filename = path.split("/").pop();
      var id = filename.split(".").shift();
      imageIndex[path] = id;
      loader.add(id, path);
    });

    // on load, assign textures to content and resolve
    loader.load(function(loader, resources){
      _.each(network, function(branch, i){
        _.each(branch.nodes, function(node, j){
          var imageId = "placeholder";
          if (node.image) imageId = imageIndex[node.image];
          _this.content.network[i].nodes[j].texture = resources[imageId].texture;
        });
      });
      deferred.resolve();
    });

    return deferred.promise();
  };

  AppCascading.prototype.loadControls = function(){
    var _this = this;

    var controls = new Controls(this.opt.controls);

    return controls.load();
  };

  AppCascading.prototype.loadListeners = function(){
    var _this = this;
    var $document = $(document);

    var onRotate = function(e, value) {
      _this.onRotate(value);
    };
    $document.on("controls.rotate", onRotate);

    var onFactboxHide = function(e, value){ _this.factbox.hide(); };
    var onFactboxReset = function(e, branch){ _this.factbox.reset(branch); };
    var onFactboxShow = function(e, branch){ _this.factbox.show(branch); };
    var onFactboxTransition = function(e, value){ _this.factbox.transition(value); };
    $document.on("factbox.hide", onFactboxHide);
    $document.on("factbox.reset", onFactboxReset);
    $document.on("factbox.show", onFactboxShow);
    $document.on("factbox.transition", onFactboxTransition);

    $(window).on('resize', function(){
      _this.onResize();
    });

  };

  AppCascading.prototype.loadSounds = function(){
    var _this = this;

    var sound = new Sound(this.opt.sound);

    return sound.load();
  };

  AppCascading.prototype.onBranchChange = function(branch){
    this.factbox.onBranchChange(branch);
  };

  AppCascading.prototype.onReady = function(){
    var d = this.data;

    var opt = _.extend({}, this.opt.network, this.content);

    // Initialize slideshow
    this.network = new Network(opt);

    // Initialize factbox
    opt = _.extend({}, this.opt.factbox, this.content);
    this.factbox = new FactBox(opt);

    // Init sleep mode utilitys
    // opt = _.extend({}, this.opt.sleep);
    // this.sleep = new Sleep(opt);

    this.render();
  };

  AppCascading.prototype.onResize = function(){
  };

  AppCascading.prototype.onRotate = function(delta){
    // this.sleep.wakeUp();
    this.network.onRotate(delta);
  };

  AppCascading.prototype.render = function() {
    var _this = this;

    this.network.render();

    requestAnimationFrame(function(){ _this.render(); });
  };

  return AppCascading;

})();
