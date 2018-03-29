'use strict';

var Content = (function() {
  function Content(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Content.prototype.init = function(){
    this.annotations = this.opt.annotations.slice(0);

    this.loadUI();
  };

  Content.prototype.loadUI = function(){
    var _this = this;

    _.each(this.annotations, function(a, i){
      var $container = $(a.parentEl);
      var $annotation = $('<div id="'+a.id+'" class="annotation"></div>');
      if (a.className) $annotation.addClass(a.className);
      if (a.title) $annotation.append('<h3>'+a.title+'</h3>');
      if (a.image) $annotation.append('<img src="'+a.image+'" alt="'+a.imageAlt+'" />');
      if (a.text) $annotation.append('<p>'+a.text+'</p>');
      $container.append($annotation);
      _this.annotations[i].$el = $annotation;
    });
  };

  Content.prototype.update = function(annotation){
    $(".annotation").removeClass('active');

    if (!annotation) return false;

    var i = annotation.index;
    this.annotations[i].$el.addClass('active');
  };

  return Content;

})();
