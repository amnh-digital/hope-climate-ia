'use strict';

var Slideshow = (function() {
  function Slideshow(options) {
    var defaults = {
      el: '#slideshow',
      slideMargin: 0.05
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Slideshow.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.$captions = $(this.opt.captionsEl);
    this.slides = this.opt.slideshow;
    this.aspectRatio = this.opt.width / this.opt.height;
    this.slideCount = this.slides.length;

    this.currentSlide = 0;
    this.transitioning = false;

    this.initSlides();
    this.initCaptions();
  };

  Slideshow.prototype.initCaptions = function(){
    var $el = this.$captions;
    var $wrapper = $('<div class="captions-wrapper"></div>');
    var slides = this.slides;
    _.each(slides, function(slide, i){
      var $caption = $('<div class="caption"></div>');
      $caption.append('<div class="text">'+slide.caption+'</div>');
      $caption.append('<div class="credit">Image credit: <a href="'+slide.creditUrl+'">'+slide.credit+'</a></div>');
      if (i===0) $caption.addClass("active");
      $wrapper.append($caption);
    });
    $el.append($wrapper);
  };

  Slideshow.prototype.initSlides = function(){
    var w = this.$el.width();
    var h = this.$el.height();
    var slides = this.slides;
    var dupedSlides = [slides[slides.length-1]].concat(slides.slice(), [slides[0]]); // duplicate the last and first slide
    var slideLen = dupedSlides.length;

    var slideH = h;
    var slideW = slideH * this.aspectRatio;
    var slideMargin = slideW * this.opt.slideMargin;
    var slideOffset = (slideW + slideMargin);
    var wrapperWidth = slideOffset * slideLen;

    this.slideOffset = slideOffset;

    var $wrapper = $('<div class="slideshow-wrapper"></div>');
    $wrapper.css({
      "width": wrapperWidth + "px",
      "height": h + "px",
      "left": "-" + slideOffset + "px"
    });

    _.each(dupedSlides, function(slide, i){
      var $slide = $('<div class="slide"></div>');
      $slide.append('<div class="image before" style="background-image: url('+slide.before+')"><div class="label">'+slide.labelBefore+'</div></div>');
      $slide.append('<div class="image after" style="background-image: url('+slide.after+')"><div class="label">'+slide.labelAfter+'</div></div>');
      $slide.css({
        "width": slideW + "px",
        "height": slideH + "px",
        "margin-right": slideMargin + "px"
      });
      $wrapper.append($slide);
    });
    this.$el.append($wrapper);
  };

  Slideshow.prototype.next = function(){
    if (this.transitioning) return false;

    var _this = this;
    var $wrapper = $('.slideshow-wrapper');
    this.currentSlide += 1;

    if (this.currentSlide >= this.slideCount) {
      $wrapper.addClass('resetting');
      $wrapper.css('left', '0px');
      this.currentSlide = -1;
      setTimeout(function(){
        _this.next();
      }, 50);
      return;
    }

    $wrapper.removeClass('resetting');
    var slideOffset = this.slideOffset * (this.currentSlide+1);
    $wrapper.css('left', -slideOffset+'px');

    $('.caption').removeClass('active');
    $('.caption').eq(this.currentSlide).addClass('active');

    this.transitioning = true;
    setTimeout(function(){
      _this.transitioning = false;
    }, 1000);
  };

  Slideshow.prototype.onResize = function(){
    var w = this.$el.width();
    var h = this.$el.height();
    var currentSlide = this.currentSlide;

    var slideH = h;
    var slideW = slideH * this.aspectRatio;
    var slideMargin = slideW * this.opt.slideMargin;
    var slideOffset = (slideW + slideMargin);
    var wrapperWidth = slideOffset * slideLen;

    $('.slideshow-wrapper').css({
      "width": wrapperWidth + "px",
      "height": h + "px",
      "left": "-" + (currentSlide+1)*slideOffset + "px"
    });
    $('.slide').css({
      "width": slideW + "px",
      "height": slideH + "px",
      "margin-right": slideMargin + "px"
    });

    this.slideOffset = slideOffset;
  };

  Slideshow.prototype.onSlide = function(value){
    $(".image.after").width(((1-value)*100)+"%");
  };

  return Slideshow;

})();
