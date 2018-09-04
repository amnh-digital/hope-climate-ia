'use strict';

var Images = (function() {
  function Images(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Images.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.network = this.opt.network;
  };

  Images.prototype.load = function(){
    var deferred = $.Deferred();

    var _this = this;
    var $el = this.$el;
    var network = this.network;
    var images = {};
    var $container = $('<div class="images"></div>');
    var $wrapper = $('<div class="images-wrapper"></div>');

    _.each(network, function(branch, i){
      _.each(branch.nodes, function(node, j){
        if (node.image) {
          var $imageWrapper = $('<div class="image-wrapper"><img src="'+node.image+'" class="image" /><div class="arrow"></div></div>');
          var $image = $imageWrapper.find(".image");
          // var $image = $('<img src="'+node.image+'" class="image" />');
          images[node.id] = {
            "$el": $imageWrapper,
            "$image": $image
          };
          $container.append($imageWrapper);
        }
      });
    });

    var imageCount = _.keys(images).length;
    var loadedCount = 0;

    _.each(images, function(image, id){
      image.$image.on("load", function(){
        images[id].width = $(this).width();
        images[id].height = $(this).height();
        loadedCount++;
        if (loadedCount >= imageCount) {
          _this.onImagesLoaded(images);
          deferred.resolve();
        }
      });
    });

    $wrapper.append($container);
    $el.append($wrapper);
    this.$imageContainer = $container;

    return deferred.promise();
  };

  Images.prototype.loadListeners = function(){
    var _this = this;
    var $document = $(document);

    var onImagesResize = function(e, data){ _this.onImagesResize(data); };
    var onImagesReset = function(e, value){ _this.onImagesReset(); };
    var onImageTransition = function(e, angle, alpha){ _this.onImageTransition(angle, alpha); };
    var onImageShow = function(e, id){ _this.onImageShow(id); };
    $document.on("images.resize", onImagesResize);
    $document.on("images.reset", onImagesReset);
    $document.on("images.transition", onImageTransition);
    $document.on("image.show", onImageShow);
  };

  Images.prototype.onImagesLoaded = function(images){
    _.each(images, function(image, id){
      var $image = image.$el;
      $image.css({
        "top": "-"+(image.height/2)+"px",
        "left": "-"+(image.width/2)+"px"
      });
    });

    this.images = images;
    this.loadListeners();
  };

  Images.prototype.onImagesReset = function(){
    $(".images .image-wrapper").removeClass('active');
  };

  Images.prototype.onImagesResize = function(data){
    var images = this.images;

    _.each(images, function(image, id){
      var d = data[id];
      if (d) {
        var scale = d.width / image.width;
        image.$image.css('transform', 'translate3d('+d.x+'px,'+d.y+'px,0) scale3d('+scale+','+scale+','+scale+')');
      }
    });
  };

  Images.prototype.onImageShow = function(id){
    var image = this.images[id];
    if (image) image.$el.addClass('active');
  };

  Images.prototype.onImageTransition = function(angle, alpha){
    this.$imageContainer.css({
      'opacity': alpha,
      'transform': 'rotate3d(0,0,1,'+angle+'deg)'
    });
  };

  return Images;

})();
