'use strict';

var Network = (function() {
  function Network(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  function addLabelBuffers(g, labelBufferCount) {
    for (var i=0; i<labelBufferCount; i++) {
      var label = new PIXI.Text("");
      g.addChild(label);
    }
  }

  Network.prototype.init = function(){
    this.$el = $(this.opt.el);

    this.network = this.opt.network;

    this.branchCount = this.network.length;
    this.angleThreshold = this.opt.angleThreshold;
    this.angleDelta = 0;
    this.currentIndex = -1;

    this.width = this.$el.width();
    this.height = this.$el.height();

    this.loadView();
    this.refreshDimensions();
    this.renderRootNode();
  };

  Network.prototype.loadView = function(){
    var _this = this;
    this.app = new PIXI.Application(this.width, this.height, {backgroundColor : 0x000000, antialias: true});
    var rootNode = new PIXI.Graphics();
    var nodeGroups = new PIXI.Container();

    addLabelBuffers(rootNode, 1);

    _.each(this.network, function(nodeGroup, i){
      var g = new PIXI.Graphics();
      addLabelBuffers(g, nodeGroup.length * 2);
      nodeGroups.addChild(g);
      _this.network[i].g = g;
    });

    this.app.stage.addChild(nodeGroups, rootNode);
    this.rootNode = rootNode;
    this.sleepers = [rootNode, nodeGroups];
    this.dreamers = [];

    this.$el.append(this.app.view);
  };

  Network.prototype.onRotate = function(delta){
    if (this.transitioning) return false;

    var network = this.network;
    var count = this.branchCount;
    var angleThreshold = this.angleThreshold;
    var index = 0;
    var changed = false;

    // check to see if we reached the threshold for going to the next branch
    var angleDelta = this.angleDelta + delta;
    var changed = Math.abs(angleDelta) >= angleThreshold;
    if (changed && angleDelta < 0) index = this.currentIndex - 1;
    else if (changed) index = this.currentIndex + 1;
    if (index < 0) index = count - 1;
    if (index >= count) index = 0;
    this.angleDelta = angleDelta;

    // first load
    if (this.currentIndex < 0) {
      index = 0;
      changed = true;
    }

    if (changed) {
      // if (this.branch) { }
      var branch = network[index];
      this.branch = branch;
      this.currentIndex = index;

      this.transitionAngleStart = this.angleDelta;
      this.transitionStart = new Date().getTime();
      this.transitionEnd = this.transitionStart + this.opt.transitionMs;
      this.transitioning = true;
      this.angleDelta = 0;

    } else {
      this.rootNode.rotation = this.angleDelta * (Math.PI / 180);
    }
  };

  Network.prototype.refreshDimensions = function(){
    var w = this.$el.width();
    var h = this.$el.height();

    this.width = w;
    this.height = h;

    var rootNodeOpt = this.opt.rootNode;
    this.rootNodeRadius = rootNodeOpt.radius * h;
    this.rootNodeX = rootNodeOpt.x * w;
    this.rootNodeY = rootNodeOpt.y * h;
    var rootNodeTextStyle = _.extend({}, rootNodeOpt.textStyle);
    rootNodeTextStyle.fontSize *= h;
    this.rootNodeTextStyle = rootNodeTextStyle;

    var rootNode = this.rootNode;
    rootNode.pivot.set(this.rootNodeX, this.rootNodeY);
    rootNode.position.set(this.rootNodeX, this.rootNodeY)
  };

  Network.prototype.render = function(){
    if (this.transitioning) {
      var now = new Date().getTime();
      var progress = UTIL.norm(now, this.transitionStart, this.transitionEnd);
      if (progress >= 1) {
        progress = 1;
        this.transitioning = false;
      }
      var angle = this.transitionAngleStart * (1-progress);
      this.rootNode.rotation = angle * (Math.PI / 180);
    }
  };

  Network.prototype.renderRootNode = function(){
    var rootNode = this.rootNode;
    var label = rootNode.children[0];

    rootNode.clear();

    var rootNodeRadius = this.rootNodeRadius;
    var rootNodeX = this.rootNodeX;
    var rootNodeY = this.rootNodeY;
    var rootNodeTextStyle = this.rootNodeTextStyle;
    var color = parseInt(this.opt.rootNode.color);

    rootNode.beginFill(color);
    rootNode.drawCircle(rootNodeX, rootNodeY, rootNodeRadius);
    rootNode.endFill();

    label.anchor.set(0.5, 0.5);
    label.style = rootNodeTextStyle;
    label.text = "Warming";
    label.x = rootNodeX;
    label.y = rootNodeY;
  };

  return Network;

})();
