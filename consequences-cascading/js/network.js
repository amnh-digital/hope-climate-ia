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

    this.width = this.$el.width();
    this.height = this.$el.height();

    this.loadView();
    this.refreshDimensions();
    this.updateBranch(this.currentIndex);
    this.renderRootNode();

    this.branchTransitionStart = new Date().getTime();
    this.branchTransitionEnd = this.branchTransitionStart + this.branch.duration;
    this.branchTransitioning = true;
    this.render();
  };

  Network.prototype.loadView = function(){
    var _this = this;
    this.app = new PIXI.Application(this.width, this.height, {transparent: true, antialias: true});
    var rootNode = new PIXI.Graphics();

    this.sectionTitleBg = new PIXI.Graphics();
    rootNode.addChild(this.sectionTitleBg);
    addLabelBuffers(rootNode, 4);

    var container = new PIXI.Container();
    var lines = new PIXI.Graphics();
    var bg = new PIXI.Graphics();
    var circles = new PIXI.Graphics();
    var contentArea = new PIXI.Container();
    var alphaFilter = new PIXI.filters.AlphaFilter();
    alphaFilter.resolution = 2;

    var maxNodeCount = 7;
    var nodeContents = [];
    _.times(maxNodeCount, function(i){
      var nodeContent = {};

      // container
      var contentContainer = new PIXI.Graphics();
      contentContainer.alpha = 0;

      // only add label for first node
      var label = false;
      if (i===0) {
        var labelArea = new PIXI.Graphics();
        labelArea.alpha = 0;
        var labelText = new PIXI.Text("");
        labelText.anchor.set(0.5, 0.5);
        labelArea.addChild(labelText);
        contentArea.addChild(labelArea);
        label = {
          area: labelArea,
          text: labelText
        }
      }

      // description
      var description = new PIXI.Text("");
      contentContainer.addChild(description);

      // sprite
      var sprite = new PIXI.Sprite();
      contentContainer.addChild(sprite);

      // sprite mask
      var spriteMask = new PIXI.Graphics();
      sprite.addChild(spriteMask);
      sprite.mask = spriteMask;

      nodeContent.container = contentContainer;
      nodeContent.label = label;
      nodeContent.description = description;
      nodeContent.sprite = sprite;

      nodeContents.push(nodeContent);
      contentArea.addChild(contentContainer);
    });

    // assign content areas to each node in network
    this.network = _.map(this.network, function(branch, i){
      var ids = _.keys(branch.nodes);
      _.each(ids, function(id, j){
        branch.nodes[id].contentArea = nodeContents[j];
      });
      return branch;
    });

    container.filters = [alphaFilter];
    container.addChild(bg, lines, circles, contentArea);

    this.app.stage.addChild(container, rootNode);

    this.rootNode = rootNode;
    this.rootLabel = this.rootNode.children[1];
    this.rootSublabel = this.rootNode.children[2];
    this.sectionTitleFrom = this.rootNode.children[3];
    this.sectionTitleTo = this.rootNode.children[4];

    this.nodeContents = nodeContents;
    this.container = container;
    this.alphaFilter = alphaFilter;
    this.contentAreaGraphics = contentArea;
    this.lineGraphics = lines;
    this.bgGraphics = bg;
    this.circleGraphics = circles;

    this.sleepers = [this.rootNode, this.contentAreaGraphics];
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

      // reset node contents
      var nodeContents = this.nodeContents;
      _.each(this.nodeContents, function(node, i){
        node.container.alpha = 0;
        if (node.label) node.label.area.alpha = 0;
      });

      this.updateBranch(index);
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
      this.$document.trigger("factbox.reset", [this.branch]);

    } else {
      var radians = this.angleDelta * (Math.PI / 180);
      // rotate root node
      this.rootNode.rotation = radians;
      this.container.rotation = radians;
      this.alphaFilter.alpha = 1.0 - angleDeltaProgress;
      _.each(this.nodeContents, function(node){
        node.container.rotation = -radians;
        if (node.label) node.label.area.rotation = -radians;
      });
      this.$document.trigger("factbox.transition", [1.0 - angleDeltaProgress]);
    }
  };

  Network.prototype.parseNetwork = function(network){
    var nodeAlphaRange = this.opt.nodeAlphaRange.slice(0);
    var nodeMs = this.opt.nodeMs;
    var nodeTransitionMs = this.opt.nodeTransitionMs;
    var nodeContentDelayMs = this.opt.nodeContentDelayMs;
    var nodeInitialDelayMs = this.opt.nodeInitialDelayMs;
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

        // automatically set severity, probability, timeframe if not defined
        var level = Math.round(UTIL.lerp(1, 5, node.index / (levels-1)));
        if (!node.severity) node.severity = level;
        if (!node.probability) node.probability = 5 - level;
        if (!node.timeframe) node.timeframe = level;

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
        distance = Math.min(distance, 0.25);
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

        var delayMs = nodeContentDelayMs;
        if (node.parent==="root") delayMs = nodeInitialDelayMs;
        node.contentStart = node.start + segment * (delayMs/nodeMs);
        node.contentEnd = node.contentStart + segment * (nodeContentMs/nodeMs);

        // radius is based on severity
        node.nRadius = UTIL.lerp(nodeRadiusRange[0], nodeRadiusRange[1], (node.severity - 1) / 4.0);

        // update node
        nodes[id] = node;
      });

      _.each(nodes, function(n, id){
        var node = _.clone(n);

        // determine position of content
        var contentDistance = node.label ? nodeLabelRadius + node.nContentWidth * 0.5 : nodeRadiusRange[0] * 1.5 + node.nContentWidth * 0.5;
        contentDistance = node.contentDistance || contentDistance;

        var contentAngle = 0;
        var child = false;
        if (node.childCount > 0) child = nodes[node.childIds[0]];

        // make the content either to the left or right of node
        if (node.angle > 90 && !node.label) contentAngle = 180;

        contentAngle = node.contentAngle ? node.contentAngle : contentAngle;
        var contentPoint = UTIL.translatePoint([node.nx, node.ny], contentAngle, contentDistance);
        node.contentNx = contentPoint[0];
        node.contentNy = contentPoint[1];

        node.nImageWidth = node.nImageWidth ? node.nImageWidth * nodeImageWidth : nodeImageWidth;
        var imgAngle = node.imageAngle ? node.imageAngle : contentAngle;
        var imgDistance = node.imageDistance ? node.imageDistance : node.nContentWidth * 1.4;
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
    this.rootNodeY = rootNodeY;
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
    var y0 = rootNodeY * 1.1;
    var y1 = h * 0.95 - nodeRadiusRange[1];
    var x0 = nodeRadiusRange[1];
    var x1 = w - nodeRadiusRange[1];

    this.container.pivot.set(rootNodeX, rootNodeY);
    this.container.position.set(rootNodeX, rootNodeY);

    this.nodeContents = _.map(this.nodeContents, function(node, i){
      if (node.label) {
        node.label.text.style = _.extend({}, nodeLabelTextStyle, {wordWrap: true, wordWrapWidth: nodeLabelRadius*1.9, align: 'center'});
      }
      node.description.style = _.extend({}, nodeBodyTextStyle);
      return node;
    })

    this.network = _.map(this.network, function(branch, i){
      branch.nodes = _.mapObject(branch.nodes, function(node, id){
        // update node position
        node.x = UTIL.lerp(x0, x1, node.nx);
        node.y = UTIL.lerp(y0, y1, node.ny);
        node.fromX = UTIL.lerp(x0, x1, node.pnx);
        node.fromY = UTIL.lerp(y0, y1, node.pny);
        if (node.pny <= 0) {
          node.fromX = rootNodeX;
          node.fromY = rootNodeY * 1.125;
        }
        // position content area
        var contentX = UTIL.lerp(x0, x1, node.contentNx);
        var contentY = UTIL.lerp(y0, y1, node.contentNy);
        var contentWidth = node.nContentWidth * w;
        var contentHeight = node.nContentHeight * h;

        node.contentWidth = contentWidth;
        node.contentHeight = contentHeight;
        node.contentX = contentX;
        node.contentY = contentY;
        node.contentMargin = contentWidth * 0.1;
        node.imageX = UTIL.lerp(x0, x1, node.imageNx);
        node.imageY = UTIL.lerp(y0, y1, node.imageNy);

        // radius is based on severity
        node.radius = node.nRadius * h;
        // line width based on probability
        node.lineWidth = UTIL.lerp(nodeLineWidthRange[0], nodeLineWidthRange[1], (node.probability - 1) / 4.0);
        // line dash based on propability
        node.dashGapWidth = UTIL.lerp(nodeDashGapRange[0], nodeDashGapRange[1], (node.probability - 1) / 4.0);
        node.dashWidth = UTIL.lerp(nodeDashWidthRange[0], nodeDashWidthRange[1], (node.probability - 1) / 4.0);
        return node;
      });
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

    // sleep transition
    if (this.sleepTransitioning) {
      this.sleepTransition(now);
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
    var circleGraphics = this.circleGraphics;
    var bgGraphics = this.bgGraphics;
    circleGraphics.clear();
    bgGraphics.clear();
    var nodeRadius = this.nodeRadius;
    var nodeLabelRadius = this.nodeLabelRadius;
    var elasticAmount = this.opt.elasticAmount;

    _.each(branch.nodes, function(node, id){
      var p = UTIL.norm(progress, node.start, node.end);
      p = UTIL.clamp(p, 0, 1);
      _this.branch.nodes[id].progress = p;
      var content = node.contentArea;

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
          var mu = UTIL.easeInElastic(p, elasticAmount);
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

        if (content.label) {
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
      // if (node.label) contentP = 1;
      content.container.alpha = contentP;
      if (content.label) content.label.area.alpha = contentP;
    });

    this.renderDashes();
  };

  Network.prototype.renderDashes = function(t){
    var now = t ? t : new Date().getTime();
    var nodeDashMs = this.opt.nodeDashMs;
    var dashOffset = now % nodeDashMs;
    var dashProgress = dashOffset / nodeDashMs;

    var lineGraphics = this.lineGraphics;
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
    var progressEased = UTIL.easeInElastic(progress, this.opt.elasticAmount);
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
    this.alphaFilter.alpha = alpha;
    this.container.rotation = radians;
    _.each(this.branch.nodes, function(node, id){
      var content = node.contentArea;
      content.container.rotation = -radians;
      if (content.label) content.label.area.rotation = -radians;
    });
    this.$document.trigger("factbox.transition", [alpha]);
  };

  Network.prototype.renderRootNode = function(){
    var rootNode = this.rootNode;
    var label = this.rootLabel;
    var sublabel = this.rootSublabel;
    var nodeBgColor = parseInt(this.opt.nodeBgColor);

    rootNode.clear();

    var rootNodeRadius = this.rootNodeRadius;
    var rootNodeX = this.rootNodeX;
    var rootNodeY = this.rootNodeY;
    var rootNodeTextStyle = this.rootNodeTextStyle;
    var color = parseInt(this.opt.rootNode.color);
    var lineWidth = this.opt.rootNode.lineWidth * rootNodeRadius;
    var rootNodeH = rootNodeRadius * 0.45;

    rootNode.lineStyle(lineWidth, color);
    rootNode.beginFill(nodeBgColor);
    // rootNode.drawCircle(rootNodeX, rootNodeY, rootNodeRadius);
    rootNode.drawRect(rootNodeX-rootNodeRadius, rootNodeY-rootNodeH/2, rootNodeRadius*2, rootNodeH);
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
    var nodeBodyTextStyle = this.opt.nodeBodyTextStyle;
    var sectionTitleFrom = this.sectionTitleFrom;
    var sectionTitleTo = this.sectionTitleTo;
    var sectionTitleBg = this.sectionTitleBg;
    var sublabel = this.rootSublabel;

    sectionTitleFrom.text = this.transitionFromBranch ? this.transitionFromBranch.title : "";
    sectionTitleTo.text = this.branch.title;
    sectionTitleFrom.alpha = 1.0 - progress;
    sectionTitleTo.alpha = progress;

    sectionTitleFrom.anchor.set(0, 0.5);
    sectionTitleFrom.style = _.extend({}, rootNodeTextStyle, {fill: nodeBodyTextStyle.fill});
    sectionTitleFrom.x = sublabel.x + sublabel.width * 1.1;
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
    var color = 0x000000;
    if (progress < threshold) {
      var colorProgress = UTIL.easeInOutSin(progress/threshold);
      color = UTIL.lerpColor(0x058599, 0x000000, colorProgress);
    }

    sectionTitleBg.clear();
    sectionTitleBg.beginFill(color);
    sectionTitleBg.drawRect(x, y, width, height);
    sectionTitleBg.endFill();
  };

  Network.prototype.renderTransition = function(t){
    var now = t ? t : new Date().getTime();
    var progress = UTIL.norm(now, this.transitionStart, this.transitionEnd);
    var progressEased = UTIL.easeInElastic(progress, this.opt.elasticAmount);
    if (progress >= 1) {
      progress = 1;
      this.transitioning = false;
    }

    // rotate root node
    var angle = this.transitionAngleStart * (1-progressEased);
    var radians = angle * (Math.PI / 180);
    this.rootNode.rotation = radians;

    this.alphaFilter.alpha = progressEased;
    this.container.rotation = -radians;
    _.each(this.branch.nodes, function(node, id){
      var content = node.contentArea;
      content.container.rotation = radians;
      if (content.label) content.label.area.rotation = radians;
    });

    // transition title
    this.renderSectionTitle(progressEased);
  };

  Network.prototype.sleepEnd = function(){
    if (this.sleeping) {
      this.sleepTransitionStart = new Date();
      this.sleepTransitioning = true;
      this.sleeping = false;
    }
  };

  Network.prototype.sleepStart = function(){
    this.sleepTransitionStart = new Date();
    this.sleepTransitioning = true;
    this.sleeping = true;
  };

  Network.prototype.sleepTransition = function(now){
    var transitionMs = this.opt.sleepTransitionMs;;
    var delta = now - this.sleepTransitionStart;
    var progress = delta / transitionMs;

    if (progress >= 1) {
      progress = 1.0;
      this.sleepTransitioning = false;
    }

    var alpha = 1.0 - progress;
    if (!this.sleeping) alpha = progress;

    _.each(this.sleepers, function(g){
      g.alpha = alpha;
    });
  };

  Network.prototype.updateBranch = function(index){
    // update node contents
    var branch = this.network[index];
    branch.nodes = _.mapObject(branch.nodes, function(node, id){
      node.drawn = false;
      node.done = false;

      // set container
      var content = node.contentArea;
      content.container.pivot.set(node.contentX, node.contentY);
      content.container.position.set(node.contentX, node.contentY);

      // DEBUG: uncomment to debug content placement
      // content.container.clear();
      // content.container.beginFill(0xff0000);
      // content.container.drawRect(x, y, node.contentWidth, node.contentHeight);
      // content.container.endFill();

      // set label
      if (content.label) {
        content.label.text.text = node.label;
        content.label.area.pivot.set(node.x, node.y);
        content.label.area.position.set(node.x, node.y);
        content.label.text.position.set(node.x, node.y);
      }

      // set desription
      var x = node.contentX - node.contentWidth * 0.5;
      var y = node.contentY - node.contentHeight * 0.5;
      content.description.text = node.description;
      content.description.position.set(node.contentMargin + x, y);
      content.description.style.wordWrapWidth = node.contentWidth - node.contentMargin;

      // set sprite
      if (node.texture) {
        content.sprite.texture = node.texture;
        content.sprite.width = node.nImageWidth * node.contentWidth;
        content.sprite.height = content.sprite.width / node.imageRatio;
        var multiply = node.originalWidth / content.sprite.width;
        var diameter = Math.min(content.sprite.width, content.sprite.height);
        var radius = diameter/2 * multiply;
        content.sprite.mask.clear();
        content.sprite.mask.beginFill();
        content.sprite.mask.drawCircle(radius, radius, radius);
        content.sprite.mask.endFill();
        content.sprite.position.set(node.imageX - diameter*0.5, node.imageY - diameter*0.5);
        content.sprite.alpha = 1;
      } else {
        content.sprite.alpha = 0;
      }

      return node;
    });

    this.branch = branch;
  };

  return Network;

})();
