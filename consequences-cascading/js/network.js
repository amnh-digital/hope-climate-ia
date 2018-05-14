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
    this.$document = $(document);
    this.network = this.parseNetwork(this.opt.network);

    this.branchCount = this.network.length;
    this.angleThreshold = this.opt.angleThreshold;
    this.angleDelta = 0;
    this.angleDeltaProgress = 0;

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

    this.sectionTitleBg = new PIXI.Graphics();
    rootNode.addChild(this.sectionTitleBg);
    addLabelBuffers(rootNode, 4);

    this.network = _.map(this.network, function(branch, i){
      var container = new PIXI.Container();
      var lines = new PIXI.Graphics();
      var bg = new PIXI.Graphics();
      var circles = new PIXI.Graphics();
      var contentAreas = new PIXI.Container();
      var alphaFilter = new PIXI.filters.AlphaFilter();
      alphaFilter.resolution = 2;
      branch.nodes = _.mapObject(branch.nodes, function(node, id){
        var contentArea = new PIXI.Graphics();
        if (node.label && node.label.length) {
          var label = new PIXI.Text(node.label);
          contentArea.addChild(label);
          node.label = label;
        } else {
          node.label = false;
        }
        if (node.description && node.description.length) {
          var description = new PIXI.Text(node.description);
          contentArea.addChild(description);
          node.description = description;
        } else {
          node.description = false;
        }
        if (node.texture) {
          var sprite = new PIXI.Sprite(node.texture);
          node.imageRatio = sprite.width / sprite.height;
          contentArea.addChild(sprite);
          node.sprite = sprite;
          var spriteMask = new PIXI.Graphics();
          sprite.addChild(spriteMask);
          node.sprite.mask = spriteMask;
        }
        contentArea.alpha = 0;
        contentAreas.addChild(contentArea);
        node.contentArea = contentArea;
        return node;
      });
      container.filters = [alphaFilter];
      container.addChild(bg, lines, circles, contentAreas);
      branches.addChild(container);
      branch.container = container;
      branch.alphaFilter = alphaFilter;
      branch.contentAreaGraphics = contentAreas;
      branch.lineGraphics = lines;
      branch.bgGraphics = bg;
      branch.circleGraphics = circles;
      return branch;
    });

    this.app.stage.addChild(branches, rootNode);

    this.rootNode = rootNode;
    this.rootLabel = this.rootNode.children[1];
    this.rootSublabel = this.rootNode.children[2];
    this.sectionTitleFrom = this.rootNode.children[3];
    this.sectionTitleTo = this.rootNode.children[4];

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
    var branchTransitioning = this.branchTransitioning;

    // check to see if we reached the threshold for going to the next branch
    var angleDelta = this.angleDelta + delta;
    var changed = Math.abs(angleDelta) >= angleThreshold;
    var angleDeltaProgress = Math.abs(angleDelta) / angleThreshold;
    if (changed && angleDelta < 0) index = this.currentIndex - 1;
    else if (changed) index = this.currentIndex + 1;
    if (index < 0) index = count - 1;
    if (index >= count) index = 0;
    this.angleDelta = angleDelta;
    this.angleDeltaProgress = angleDeltaProgress;

    // start the countdown to reset
    this.resetting = false;
    this.resetCountingDown = true;
    this.resetStart = new Date().getTime() + this.opt.resetAfterMs;
    this.resetEnd = this.resetStart + this.opt.resetTransitionMs;
    this.resetAngleStart = this.angleDelta;
    this.resetAngleProgressStart = this.angleDeltaProgress;

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
      branch.nodes = _.mapObject(branch.nodes, function(node, id){
        node.drawn = false;
        node.done = false;
        node.contentArea.alpha = 0;
        return node;
      });
      this.branch = branch;
      this.currentIndex = index;

      this.transitionAngleStart = this.angleDelta;
      this.transitionStart = new Date().getTime();
      this.transitionEnd = this.transitionStart + this.opt.transitionMs;
      this.transitioning = true;
      this.angleDelta = 0;
      this.angleDeltaProgress = 0;

      this.branchTransitionStart = new Date().getTime();
      this.branchTransitionEnd = this.branchTransitionStart + this.branch.duration;
      this.branchTransitioning = true;

      this.resetCountingDown = false;
      this.$document.trigger("factbox.hide", [true]);
      this.$document.trigger("factbox.reset", [branch]);

    } else {
      var radians = this.angleDelta * (Math.PI / 180);
      // rotate root node
      this.rootNode.rotation = radians;
      this.branch.container.rotation = radians;
      this.branch.alphaFilter.alpha = 1.0 - angleDeltaProgress;
      _.each(this.branch.nodes, function(node, id){
        node.contentArea.rotation = -radians;
      });
      this.$document.trigger("factbox.transition", [1.0 - angleDeltaProgress]);
    }
  };

  Network.prototype.parseNetwork = function(network){
    var nodeAlphaRange = this.opt.nodeAlphaRange.slice(0);
    var nodeMs = this.opt.nodeMs;
    var nodeTransitionMs = this.opt.nodeTransitionMs;
    var nodeContentDelayMs = this.opt.nodeContentDelayMs;
    var nodeContentMs = this.opt.nodeContentMs;
    var nodeRadiusRange = this.opt.nodeRadiusRange;
    var nodeContentWidth = this.opt.nodeContentWidth;
    var nodeContentHeight = this.opt.nodeContentHeight;
    var nodeColor = parseInt(this.opt.nodeColor);
    var nodeLineColor = parseInt(this.opt.nodeLineColor);
    var nodeBgColor = parseInt(this.opt.nodeBgColor);
    var nodeLabelRadius = this.opt.nodeLabelRadius;
    var nodeImageWidth = this.opt.nodeImageWidth;

    return _.map(network, function(branch, i){
      branch.index = i;
      var nodeCount = branch.nodes.length;
      branch.duration = nodeMs * nodeCount;

      // tranform nodes into a hash
      var nodeIds = _.pluck(branch.nodes, 'id');
      branch.nodeIds = nodeIds;
      var nodes = _.object(_.map(branch.nodes, function(node, j){
        return [node.id, node];
      }));

      _.each(nodes, function(n, id){
        var node = _.clone(n);

        // retrieve parent info
        var parent = false;
        var parentChildCount = 0;
        var index = 0;
        if (node.parent !== "root") {
          parent = nodes[node.parent];
          parentChildCount = parent.childCount;
          index = parent.index + 1;
        }
        node.index = index;
        node.parentChildCount = parentChildCount;

        // check for children
        var children = _.filter(nodes, function(cnode){ return cnode.parent===id});
        var childCount = children.length;
        node.childCount = childCount;
        node.childIds = _.pluck(children, 'id');

        // update node
        nodes[id] = node;
      });

      var indices = _.pluck(nodes, "index");
      var levels = _.max(indices) + 1;
      var segment = 1.0 / levels;

      _.each(nodes, function(n, id){
        var node = _.clone(n);

        // retrieve parent info
        var parent = false;
        var parentNX = 0.5;
        var parentNY = 0;
        if (node.parent !== "root") {
          parent = nodes[node.parent];
          parentNX = parent.nx;
          parentNY = parent.ny;
        }
        node.pnx = parentNX;
        node.pny = parentNY;

        var parentChildCount = node.parentChildCount;
        var index = node.index;

        // determine normal position
        var distance = node.distance ? node.distance : segment;
        distance = Math.min(distance, 0.33);
        var baseAngle = 90;
        var anglePad = 15;
        // evenly space children if multiple children
        if (parentChildCount > 1) {
          var childIndex = parent.childIds.indexOf(id);
          var childMu = 1.0 * childIndex / (parentChildCount-1);
          var maxAngle = parentChildCount * anglePad;
          baseAngle = UTIL.lerp(baseAngle-maxAngle, baseAngle+maxAngle, childMu);
        }
        // determine position via angle + distance
        var angle = node.angle ? node.angle : _.random(baseAngle-anglePad, baseAngle+anglePad);
        var point = UTIL.translatePoint([parentNX, parentNY], angle, distance);
        node.angle = angle;
        node.nx = point[0];
        node.ny = point[1];

        node.nContentWidth = node.nContentWidth ? node.nContentWidth : nodeContentWidth;
        node.nContentHeight = node.nContentHeight ? node.nContentHeight : nodeContentHeight;

        if (node.label && node.label.length) {
          node.nContentWidth = nodeLabelRadius * 2;
          node.nContentHeight = node.nContentWidth;
        }

        // determine sound based on severity
        node.soundMu = (node.severity - 1) / 4.0;

        // alpha is based on probability
        node.a = UTIL.lerp(nodeAlphaRange[0], nodeAlphaRange[1], (node.probability - 1) / 4.0);
        node.color = nodeColor;
        node.lineColor = nodeLineColor;
        node.bgColor = nodeBgColor;
        var start = 1.0 * index / nodeCount;
        var end = 1.0 * (index+1) / nodeCount;
        var pad = 1.0 / nodeCount / 4.0;
        var delta = 0;
        if (parentChildCount > 1) {
          delta = UTIL.random(-pad, pad);
        }
        node.start = start + delta;
        node.end = UTIL.lerp(start, end, nodeTransitionMs/nodeMs) + delta;
        node.contentStart = node.start + segment * (nodeContentDelayMs/nodeMs);
        node.contentEnd = node.contentStart + segment * (nodeContentMs/nodeMs);

        // radius is based on severity
        node.nRadius = UTIL.lerp(nodeRadiusRange[0], nodeRadiusRange[1], (node.severity - 1) / 4.0);

        // update node
        nodes[id] = node;
      });

      _.each(nodes, function(n, id){
        var node = _.clone(n);

        // determine position of content
        var contentDistance = node.contentDistance ? node.contentDistance : nodeRadiusRange[0] * 2 + node.nContentWidth * 0.5;
        var contentAngle = node.angle;
        var child = false;
        if (node.childCount > 0) child = nodes[node.childIds[0]];

        // if child, make the angle the normal angle between the two nodes' angles
        if (child) {
          var childAngle = child.angle;
          contentAngle = (contentAngle + childAngle) * 0.5 + 90;
          if (childAngle > node.angle && node.childCount===1 || node.childCount > 1) contentAngle -= 180;
        }

        contentAngle = node.contentAngle ? node.contentAngle : contentAngle;
        var contentPoint = UTIL.translatePoint([node.nx, node.ny], contentAngle, contentDistance);
        node.contentNx = contentPoint[0];
        node.contentNy = contentPoint[1];

        if (node.label && node.label.length) {
          node.contentNx = node.nx;
          node.contentNy = node.ny;
        }

        node.nImageWidth = node.nImageWidth ? node.nImageWidth : nodeImageWidth;
        var imgAngle = node.imageAngle ? node.imageAngle : 270; // north by default
        var imgDistance = node.imageDistance ? node.imageDistance : node.nImageWidth * 0.375;
        var imagePoint = UTIL.translatePoint([node.contentNx, node.contentNy], imgAngle, imgDistance);
        node.imageNx = imagePoint[0];
        node.imageNy = imagePoint[1];


        // update node
        nodes[id] = node;
      });

      branch.nodes = nodes;

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
    this.rootNodeY = rootNodeY * 1.2;
    var rootNodeTextStyle = _.extend({}, rootNodeOpt.textStyle);
    rootNodeTextStyle.fontSize *= h;
    this.rootNodeTextStyle = rootNodeTextStyle;

    var rootNode = this.rootNode;
    rootNode.pivot.set(rootNodeX, rootNodeY);
    rootNode.position.set(rootNodeX, rootNodeY);

    var nodeLabelTextStyle = _.extend({}, this.opt.nodeLabelTextStyle);
    var nodeBodyTextStyle = _.extend({}, this.opt.nodeBodyTextStyle);
    nodeLabelTextStyle.fontSize *= h;
    nodeBodyTextStyle.fontSize *= h;
    nodeBodyTextStyle.lineHeight = nodeBodyTextStyle.fontSize * nodeBodyTextStyle.lineHeight;

    var nodeLabelRadius = this.opt.nodeLabelRadius * h;
    this.nodeLabelRadius = nodeLabelRadius;

    // set position for each branch/node in the network
    var nodeRadiusRange = this.opt.nodeRadiusRange.slice(0);
    var nodeLineWidthRange = this.opt.nodeLineWidthRange.slice(0);
    var nodeDashGapRange = this.opt.nodeDashGapRange.slice(0);
    var nodeDashWidthRange = this.opt.nodeDashWidthRange.slice(0);
    nodeRadiusRange[0] *= h;
    nodeRadiusRange[1] *= h;
    var y0 = rootNodeY + this.rootNodeRadius;
    var y1 = h * 0.95 - nodeRadiusRange[1];
    var x0 = nodeRadiusRange[1];
    var x1 = w - nodeRadiusRange[1];
    this.network = _.map(this.network, function(branch, i){
      branch.nodes = _.mapObject(branch.nodes, function(node, id){
        // update node position
        node.x = UTIL.lerp(x0, x1, node.nx);
        node.y = UTIL.lerp(y0, y1, node.ny);
        node.fromX = UTIL.lerp(x0, x1, node.pnx);
        node.fromY = UTIL.lerp(y0, y1, node.pny);
        // position content area
        var contentX = UTIL.lerp(x0, x1, node.contentNx);
        var contentY = UTIL.lerp(y0, y1, node.contentNy);
        var contentWidth = node.nContentWidth * w;
        var contentHeight = node.nContentHeight * h;
        node.contentArea.pivot.set(contentX, contentY);
        node.contentArea.position.set(contentX, contentY);
        // update sprite
        var x = contentX - contentWidth * 0.5;
        var y = contentY - contentHeight * 0.5;
        // DEBUG: uncomment to debug content placement
        // node.contentArea.clear();
        // node.contentArea.beginFill(0xff0000);
        // node.contentArea.drawRect(x, y, contentWidth, contentHeight);
        // node.contentArea.endFill();
        var contentMargin = contentWidth * 0.1;
        if (node.sprite) {
          node.imageX = UTIL.lerp(x0, x1, node.imageNx);
          node.imageY = UTIL.lerp(y0, y1, node.imageNy);
          node.sprite.width = node.nImageWidth * contentWidth;
          node.sprite.height = node.sprite.width / node.imageRatio;
          var multiply = node.originalWidth / node.sprite.width;
          var diameter = Math.min(node.sprite.width, node.sprite.height);
          var radius = diameter/2 * multiply;
          node.imageX -= diameter*0.5;
          node.sprite.mask.clear();
          node.sprite.mask.beginFill();
          node.sprite.mask.drawCircle(radius, radius, radius);
          node.sprite.mask.endFill();
          node.sprite.position.set(node.imageX, node.imageY);
        }
        if (node.label) {
          node.label.anchor.set(0.5, 0.5);
          node.label.position.set(node.x, node.y);
          node.label.style = _.extend({}, nodeLabelTextStyle, {wordWrap: true, wordWrapWidth: nodeLabelRadius*1.9, align: 'center'});
        }
        if (node.description) {
          node.description.position.set(contentMargin + x, y);
          node.description.style = _.extend({}, nodeBodyTextStyle, {wordWrapWidth: contentWidth-contentMargin});
        }
        // radius is based on severity
        node.radius = node.nRadius * h;
        // line width based on probability
        node.lineWidth = UTIL.lerp(nodeLineWidthRange[0], nodeLineWidthRange[1], (node.probability - 1) / 4.0);
        // line dash based on propability
        node.dashGapWidth = UTIL.lerp(nodeDashGapRange[0], nodeDashGapRange[1], (node.probability - 1) / 4.0);
        node.dashWidth = UTIL.lerp(nodeDashWidthRange[0], nodeDashWidthRange[1], (node.probability - 1) / 4.0);
        return node;
      });
      branch.container.pivot.set(rootNodeX, rootNodeY);
      branch.container.position.set(rootNodeX, rootNodeY);
      return branch;
    });

    this.nodeRadius = nodeRadiusRange[0];

  };

  Network.prototype.render = function(){
    var now = new Date().getTime();

    // we are transition to a new branch
    if (this.transitioning) {
      this.renderTransition(now);
    }

    // branch nodes are animating in
    if (this.branchTransitioning) {
      this.renderBranch(now);

    // branch is finished rendering, just animate dashes
    } else {
      this.renderDashes(now);
    }

    // check if we need to reset
    if (this.resetCountingDown && now > this.resetStart) {
      this.resetting = true;
      this.resetCountingDown = false;
    }

    if (this.resetting) {
      this.renderReset(now);
    }
  };

  Network.prototype.renderBranch = function(t){
    var _this = this;
    var now = t ? t : new Date().getTime();
    var branch = this.branch;
    var $document = this.$document;
    var progress = UTIL.norm(now, this.branchTransitionStart, this.branchTransitionEnd);
    if (progress >= 1) {
      progress = 1;
      this.branchTransitioning = false;
      $document.trigger("factbox.show", [branch]);
    }
    var angleDeltaProgress = this.angleDeltaProgress;
    var circleGraphics = this.branch.circleGraphics;
    var bgGraphics = this.branch.bgGraphics;
    circleGraphics.clear();
    bgGraphics.clear();
    var nodeRadius = this.nodeRadius;
    var nodeLabelRadius = this.nodeLabelRadius;

    _.each(branch.nodes, function(node, id){
      var p = UTIL.norm(progress, node.start, node.end);
      p = UTIL.clamp(p, 0, 1);
      _this.branch.nodes[id].progress = p;

      if (p > 0) {
        if (!node.drawn) {
          $document.trigger("sound.play.percent", [node.soundMu]);
          _this.branch.nodes[id].drawn = true;
        }

        var alpha = node.a;
        var x0 = node.fromX;
        var x1 = node.x;
        var y0 = node.fromY;
        var y1 = node.y;
        var radius = node.radius;
        var color = node.color;
        var bgColor = node.bgColor;

        if (p < 1.0) {
          var mu = UTIL.easeInElastic(p);
          var lerpPoint = UTIL.lerpLine(node.fromX, node.fromY, node.x, node.y, mu);
          x1 = lerpPoint[0];
          y1 = lerpPoint[1];
          radius = radius * mu;
        }

        _this.branch.nodes[id].toX = x1;
        _this.branch.nodes[id].toY = y1;

        bgGraphics.beginFill(bgColor);
        bgGraphics.drawCircle(x1, y1, radius);
        bgGraphics.endFill();

        if (node.label) {
          circleGraphics.beginFill(0x000000);
          circleGraphics.lineStyle(4, color);
          circleGraphics.drawCircle(x1, y1, nodeLabelRadius);
          circleGraphics.endFill();

        } else {
          circleGraphics.beginFill(color);
          circleGraphics.lineStyle(0);
          circleGraphics.drawCircle(x1, y1, nodeRadius);
          circleGraphics.endFill();
        }

        // draw content
        // if (p >= 1.0) {
        //   circleGraphics.beginFill(0xff0000);
        //   circleGraphics.drawCircle(node.contentX, node.contentY, 10);
        //   circleGraphics.endFill();
        // }
      }

      var contentP = UTIL.norm(progress, node.contentStart, node.contentEnd);
      contentP = UTIL.clamp(contentP, 0, 1);
      node.contentArea.alpha = contentP;
    });

    this.renderDashes();
  };

  Network.prototype.renderDashes = function(t){
    var now = t ? t : new Date().getTime();
    var nodeDashMs = this.opt.nodeDashMs;
    var dashOffset = now % nodeDashMs;
    var dashProgress = dashOffset / nodeDashMs;

    var lineGraphics = this.branch.lineGraphics;
    lineGraphics.clear();

    var dashLine = function(g, x0, y0, x1, y1, width, gap, offset) {
      // no dash = straight line
      if (gap <= 0) {
        g.moveTo(x0, y0).lineTo(x1, y1);
        return;
      }
      var d = UTIL.distance(x0, y0, x1, y1);
      g.moveTo(x0, y0);
      while (offset < d) {
        var p;
        // account for beginning with just a gap
        if (offset < gap) {
          p = UTIL.lerpLine(x0, y0, x1, y1, offset/d);
          g.moveTo(p[0], p[1]);
        // beginning with partial line
        } else if (offset < (gap + width)) {
          var delta = offset - gap;
          p = UTIL.lerpLine(x0, y0, x1, y1, delta/d);
          g.lineTo(p[0], p[1]);
          p = UTIL.lerpLine(x0, y0, x1, y1, offset/d);
          g.moveTo(p[0], p[1]);
        }
        // draw the line
        offset += width;
        if (offset > d) offset = d; // account for end of line
        p = UTIL.lerpLine(x0, y0, x1, y1, offset/d);
        g.lineTo(p[0], p[1]);
        // make the gap
        offset += gap;
        p = UTIL.lerpLine(x0, y0, x1, y1, offset/d);
        g.moveTo(p[0], p[1]);
      }
    };

    _.each(this.branch.nodes, function(node, id){

      if (node.progress > 0) {
        var alpha = node.a;
        var x0 = node.fromX;
        var x1 = node.toX;
        var y0 = node.fromY;
        var y1 = node.toY;
        lineGraphics.lineStyle(node.lineWidth, node.lineColor, alpha);
        dashLine(lineGraphics, x0, y0, x1, y1, node.dashWidth, node.dashGapWidth, dashProgress*(node.dashGapWidth+node.dashWidth));
      }

    });
  };

  Network.prototype.renderReset = function(t){
    if (this.transitioning) return false;

    var now = t ? t : new Date().getTime();
    var progress = UTIL.norm(now, this.resetStart, this.resetEnd);
    var progressEased = UTIL.easeInElastic(progress);
    if (progress >= 1) {
      progress = 1;
      this.resetting = false;
    }

    // rotate root node
    var angle = this.resetAngleStart * (1-progressEased);
    var radians = angle * (Math.PI / 180);
    this.rootNode.rotation = radians;
    this.angleDelta = angle;
    this.angleDeltaProgress = Math.abs(this.angleDelta) / this.angleThreshold;

    var alpha = UTIL.lerp(1.0-this.resetAngleProgressStart, 1.0, progressEased);
    this.branch.alphaFilter.alpha = alpha;
    this.branch.container.rotation = radians;
    _.each(this.branch.nodes, function(node, id){
      node.contentArea.rotation = -radians;
    });
    this.$document.trigger("factbox.transition", [alpha]);
  };

  Network.prototype.renderRootNode = function(){
    var rootNode = this.rootNode;
    var label = this.rootLabel;
    var sublabel = this.rootSublabel;

    rootNode.clear();

    var rootNodeRadius = this.rootNodeRadius;
    var rootNodeX = this.rootNodeX;
    var rootNodeY = this.rootNodeY;
    var rootNodeTextStyle = this.rootNodeTextStyle;
    var color = parseInt(this.opt.rootNode.color);
    var lineWidth = this.opt.rootNode.lineWidth * rootNodeRadius;

    rootNode.lineStyle(lineWidth, color);
    rootNode.beginFill(0x000000);
    rootNode.drawCircle(rootNodeX, rootNodeY, rootNodeRadius);
    rootNode.endFill();

    label.anchor.set(0.5, 0.5);
    label.style = rootNodeTextStyle;
    label.text = "Global warming";
    label.x = rootNodeX;
    label.y = rootNodeY ;

    sublabel.anchor.set(0, 0.5);
    sublabel.style = rootNodeTextStyle;
    sublabel.text = "could lead to";
    sublabel.x = rootNodeX + rootNodeRadius * 1.1;
    sublabel.y = rootNodeY;

    this.renderSectionTitle();
  };

  Network.prototype.renderSectionTitle = function(progress){
    progress = progress===undefined ? 1 : progress;

    var rootNodeY = this.rootNodeY;
    var rootNodeTextStyle = this.rootNodeTextStyle;
    var sectionTitleFrom = this.sectionTitleFrom;
    var sectionTitleTo = this.sectionTitleTo;
    var sectionTitleBg = this.sectionTitleBg;
    var sublabel = this.rootSublabel;

    sectionTitleFrom.text = this.transitionFromBranch ? this.transitionFromBranch.title : "";
    sectionTitleTo.text = this.branch.title;
    sectionTitleFrom.alpha = 1.0 - progress;
    sectionTitleTo.alpha = progress;

    sectionTitleFrom.anchor.set(0, 0.5);
    sectionTitleFrom.style = _.extend({}, rootNodeTextStyle, {fill: "#000000", fontSize: rootNodeTextStyle.fontSize * 0.8});
    sectionTitleFrom.x = sublabel.x + sublabel.width * 1.15;
    sectionTitleFrom.y = rootNodeY;

    sectionTitleTo.text = this.branch.title;
    sectionTitleTo.anchor.set(0, 0.5);
    sectionTitleTo.style = sectionTitleFrom.style;
    sectionTitleTo.x = sectionTitleFrom.x;
    sectionTitleTo.y = sectionTitleFrom.y;

    var padX = 0.08;
    var padY = 0.1;
    var width = UTIL.lerp(sectionTitleFrom.width, sectionTitleTo.width, progress);
    var height = sectionTitleTo.height;
    var x = sectionTitleTo.x - width * padX;
    var y = sectionTitleTo.y - sectionTitleTo.height/2 - height * padY;
    width *= (1.0 + (padX * 2));
    height *= (1.0 + (padY * 2));

    // make background color pop
    var threshold = 1.0;
    var color = 0x058599;
    if (progress < threshold) {
      var colorProgress = UTIL.easeInOutSin(progress/threshold);
      color = UTIL.lerpColor(0xffffff, 0x058599, colorProgress);
    }

    sectionTitleBg.clear();
    sectionTitleBg.beginFill(color);
    sectionTitleBg.drawRect(x, y, width, height);
    sectionTitleBg.endFill();
  };

  Network.prototype.renderTransition = function(t){
    var now = t ? t : new Date().getTime();
    var progress = UTIL.norm(now, this.transitionStart, this.transitionEnd);
    var progressEased = UTIL.easeInElastic(progress);
    if (progress >= 1) {
      progress = 1;
      this.transitioning = false;
    }

    // rotate root node
    var angle = this.transitionAngleStart * (1-progressEased);
    var radians = angle * (Math.PI / 180);
    this.rootNode.rotation = radians;

    this.branch.alphaFilter.alpha = progressEased;
    this.branch.container.rotation = -radians;
    _.each(this.branch.nodes, function(node, id){
      node.contentArea.rotation = radians;
    });

    if (this.transitionFromBranch) {
      var p = 1.0 - progress;
      if (p < this.transitionFromBranch.alphaFilter.alpha) this.transitionFromBranch.alphaFilter.alpha = p;
    }

    // transition title
    this.renderSectionTitle(progressEased);
  };

  return Network;

})();
