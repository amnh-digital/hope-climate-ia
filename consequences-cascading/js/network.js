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

    this.network = this.parseNetwork(this.opt.network);

    this.branchCount = this.network.length;
    this.angleThreshold = this.opt.angleThreshold;
    this.angleDelta = 0;

    this.currentIndex = 0;
    this.branch = this.network[0];

    this.width = this.$el.width();
    this.height = this.$el.height();

    this.loadView();
    this.refreshDimensions();
    this.renderRootNode();

    this.branchTransitionStart = new Date().getTime();
    this.branchTransitionEnd = this.branchTransitionStart + this.branch.duration;
    this.branchTransitioning = true;
    this.render();
  };

  Network.prototype.loadView = function(){
    var _this = this;
    this.app = new PIXI.Application(this.width, this.height, {backgroundColor : 0x000000, antialias: true});
    var rootNode = new PIXI.Graphics();
    var branches = new PIXI.Container();

    addLabelBuffers(rootNode, 1);

    this.network = _.map(this.network, function(branch, i){
      var container = new PIXI.Container();
      var lines = new PIXI.Graphics();
      var circles = new PIXI.Graphics();
      var labels = new PIXI.Container();
      branch.nodes = _.map(branch.nodes, function(node, j){
        var label = new PIXI.Text("");
        labels.addChild(label);
        node.label = label;
        return node;
      });
      container.addChild(lines, circles, labels);
      branches.addChild(container);
      branch.container = container;
      branch.labels = labels;
      branch.lineGraphics = lines;
      branch.circleGraphics = circles;
      return branch;
    });

    this.app.stage.addChild(branches, rootNode);
    this.rootNode = rootNode;
    this.sleepers = [rootNode, branches];
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
      if (this.branch) {
        this.transitionFromBranch = this.branch;
      }
      var branch = network[index];
      this.branch = branch;
      this.currentIndex = index;

      this.transitionAngleStart = this.angleDelta;
      this.transitionStart = new Date().getTime();
      this.transitionEnd = this.transitionStart + this.opt.transitionMs;
      this.transitioning = true;
      this.angleDelta = 0;

      this.branchTransitionStart = new Date().getTime();
      this.branchTransitionEnd = this.branchTransitionStart + this.branch.duration;
      this.branchTransitioning = true;

    } else {
      var radians = this.angleDelta * (Math.PI / 180);
      // rotate root node
      this.rootNode.rotation = radians;
      this.branch.container.rotation = radians;
    }
  };

  Network.prototype.parseNetwork = function(network){
    var nodeAlphaRange = this.opt.nodeAlphaRange.slice(0);
    var nodeMs = this.opt.nodeMs;
    var nodeTransitionMs = this.opt.nodeTransitionMs;

    return _.map(network, function(branch, i){
      branch.index = i;
      var nodeCount = branch.nodes.length;
      var segment = 1.0 / nodeCount;
      var prevNX = 0.5;
      var prevNY = 0;
      var maxDelta = 0.1;
      var nodeLookup = {};
      branch.duration = nodeMs * nodeCount;
      branch.nodes = _.map(branch.nodes, function(node, j){
        if (node.parent !== "root" && _.has(nodeLookup, node.parent)) {
          prevNX = nodeLookup[node.parent].nx;
          prevNY = nodeLookup[node.parent].ny;
        }
        if (node.nx <= 0) node.nx = prevNX + (Math.random() * 2 - 1) * maxDelta;
        if (node.ny <= 0) node.ny = prevNY + segment;
        node.pnx = prevNX;
        node.pny = prevNY;
        // alpha is based on probability
        node.a = UTIL.lerp(nodeAlphaRange[0], nodeAlphaRange[1], (node.probability - 1) / 4.0);
        node.color = 0x005052;
        node.lineColor = 0x005052;
        var start = 1.0 * j / nodeCount;
        var end = 1.0 * (j+1) / nodeCount;
        node.start = start;
        node.end = UTIL.lerp(start, end, nodeTransitionMs/nodeMs);
        prevNX = node.nx;
        prevNY = node.ny;
        nodeLookup[node.id] = {
          nx: node.nx,
          ny: node.ny
        };
        return node;
      });
      return branch;
    });
  };

  Network.prototype.refreshDimensions = function(){
    var _this = this;
    var w = this.$el.width();
    var h = this.$el.height();

    this.width = w;
    this.height = h;

    var rootNodeOpt = this.opt.rootNode;
    this.rootNodeRadius = rootNodeOpt.radius * h;
    var rootNodeX = rootNodeOpt.x * w;
    var rootNodeY = rootNodeOpt.y * h;
    this.rootNodeX = rootNodeX;
    this.rootNodeY = rootNodeY;
    var rootNodeTextStyle = _.extend({}, rootNodeOpt.textStyle);
    rootNodeTextStyle.fontSize *= h;
    this.rootNodeTextStyle = rootNodeTextStyle;

    var rootNode = this.rootNode;
    rootNode.pivot.set(rootNodeX, rootNodeY);
    rootNode.position.set(rootNodeX, rootNodeY);

    // set position for each branch/node in the network
    var nodeRadiusRange = this.opt.nodeRadiusRange.slice(0);
    var nodeLineWidthRange = this.opt.nodeLineWidthRange.slice(0);
    nodeRadiusRange[0] *= h;
    nodeRadiusRange[1] *= h;
    var y0 = rootNodeY;
    var y1 = h - nodeRadiusRange[1];
    var x0 = nodeRadiusRange[1];
    var x1 = w - nodeRadiusRange[1];
    this.network = _.map(this.network, function(branch, i){
      branch.nodes = _.map(branch.nodes, function(node, j){
        node.x = UTIL.lerp(x0, x1, node.nx);
        node.y = UTIL.lerp(y0, y1, node.ny);
        node.fromX = UTIL.lerp(x0, x1, node.pnx);
        node.fromY = UTIL.lerp(y0, y1, node.pny);
        // radius is based on severity
        node.r = UTIL.lerp(nodeRadiusRange[0], nodeRadiusRange[1], (node.severity - 1) / 4.0);
        // line width based on probability
        node.lineWidth = UTIL.lerp(nodeLineWidthRange[0], nodeLineWidthRange[1], (node.probability - 1) / 4.0);
        return node;
      });
      branch.container.pivot.set(rootNodeX, rootNodeY);
      branch.container.position.set(rootNodeX, rootNodeY);
      return branch;
    });
  };

  Network.prototype.render = function(){
    if (this.transitioning) {
      this.transition();
    }

    if (this.branchTransitioning) {
      this.renderBranch();
    }
  };

  Network.prototype.renderBranch = function(){
    var now = new Date().getTime();
    var progress = UTIL.norm(now, this.branchTransitionStart, this.branchTransitionEnd);
    if (progress >= 1) {
      progress = 1;
      this.branchTransitioning = false;
    }

    var lineGraphics = this.branch.lineGraphics;
    var circleGraphics = this.branch.circleGraphics;
    lineGraphics.clear();
    circleGraphics.clear();
    _.each(this.branch.nodes, function(node, i){
      var p = UTIL.norm(progress, node.start, node.end);
      p = UTIL.clamp(p, 0, 1);

      var label = node.label;
      label.alpha = p;

      if (p > 0) {
        circleGraphics.beginFill(node.color);
        lineGraphics.lineStyle(node.lineWidth, node.lineColor, node.a);
        lineGraphics.moveTo(node.fromX, node.fromY);
        if (p >= 1.0) {
          lineGraphics.lineTo(node.x, node.y);
          circleGraphics.drawCircle(node.x, node.y, node.r);

        } else {
          var mu = UTIL.easeInElastic(p);
          var lerpPoint = UTIL.lerpLine(node.fromX, node.fromY, node.x, node.y, mu);
          lineGraphics.lineTo(lerpPoint[0], lerpPoint[1]);
          circleGraphics.drawCircle(lerpPoint[0], lerpPoint[1], node.r * mu);
        }
        circleGraphics.endFill();
      }
    });
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

  Network.prototype.transition = function(){
    var now = new Date().getTime();
    var progress = UTIL.norm(now, this.transitionStart, this.transitionEnd);
    if (progress >= 1) {
      progress = 1;
      this.transitioning = false;
    }

    // rotate root node
    var angle = this.transitionAngleStart * (1-progress);
    var radians = angle * (Math.PI / 180);
    this.rootNode.rotation = radians;

    var container = this.branch.container;
    container.alpha = progress;
    container.rotation = -radians;

    if (this.transitionFromBranch) {
      container = this.transitionFromBranch.container;
      container.alpha = 1.0 - progress;
    }


  };

  return Network;

})();
