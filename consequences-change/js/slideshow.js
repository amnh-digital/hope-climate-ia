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
    this.$credits = $(this.opt.creditsEl);
    this.slides = this.opt.slides.slice(0);
    this.aspectRatio = this.opt.width / this.opt.height;
    this.slideCount = this.slides.length;
    this.currentSlide = 0;

    this.initSlides();
    this.initCaptions();
  };

  Slideshow.prototype.initCaptions = function(){
    var _this = this;
    var $captionsWrapper = $('<div class="captions-wrapper"></div>');
    var $creditsWrapper = $('<div />');
    var slides = this.slides;
    _.each(slides, function(slide, i){
      var $caption = $('<div class="caption"></div>');
      $caption.append('<h2>'+slide.caption+'</h2>');
      $caption.append('<p class="text">'+slide.longDescription+'</p>');
      var $credit = $('<div class="credit"></div>');
      $credit.html('<a href="'+slide.creditUrl+'">'+slide.credit+'</a>');
      if (i===0) {
        $caption.addClass("active");
        $credit.addClass("active");
      }
      $captionsWrapper.append($caption);
      $creditsWrapper.append($credit);
      _this.slides[i].$caption = $caption;
      _this.slides[i].$credit = $credit;
    });
    this.$captions.append($captionsWrapper);
    this.$credits.append($creditsWrapper);
  };

  Slideshow.prototype.initSlides = function(){
    var _this = this;
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
    this.slideW = slideW;

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
      $slide.append('<div class="marker"></div>');
      $slide.css({
        "width": slideW + "px",
        "height": slideH + "px",
        "margin-right": slideMargin + "px"
      });
      if (i===1) $slide.addClass("active");
      $wrapper.append($slide);

      // first and last have multiple slides
      var j = i - 1;
      if (i===0) j = slides.length - 1;
      if (i===slideLen-1) j = 0;
      if (_this.slides[j].$slides === undefined) {
        _this.slides[j].$slides = [$slide];
      } else {
        _this.slides[j].$slides.push($slide);
      }

    });
    this.$el.append($wrapper);
  };

  Slideshow.prototype.next = function(_slide){
    var _this = this;
    var $wrapper = $('.slideshow-wrapper');
    var currentSlide = _slide.index;

    // we are resetting
    if (currentSlide <= 0) {
      $wrapper.addClass('resetting');
      $wrapper.css('left', '0px');
    }

    var slide = this.slides[currentSlide];
    this.currentSlide = currentSlide;

    setTimeout(function(){
      $wrapper.removeClass('resetting');
      var slideOffset = _this.slideOffset * (currentSlide+1);
      $wrapper.css('left', -slideOffset+'px');

      $('.caption, .slide, .credit').removeClass('active');
      slide.$caption.addClass('active');
      slide.$credit.addClass('active');
      _.each(slide.$slides, function($slide) {
        $slide.addClass('active');
      });
    }, 50);
  };

  Slideshow.prototype.onResize = function(){
    var w = this.$el.width();
    var h = this.$el.height();
    var currentSlide = this.currentSlide;
    var slideLen = this.slideCount;

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

    this.slideW = slideW;
    this.slideOffset = slideOffset;
  };

  Slideshow.prototype.onSlide = function(value){
    var offset = this.slideW * value;
    $('.marker').css('transform', 'translate3d('+offset+'px, 0, 0)');
    $(".image.after").width(((1-value)*100)+"%");
  };

  return Slideshow;

})();
