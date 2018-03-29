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
      var $els = [];
      _.each(a.els, function(el, j){
        var $annotation = $('<div id="'+el.id+'" class="annotation"></div>');
        if (el.className) $annotation.addClass(el.className);
        if (el.title) $annotation.append('<h3>'+el.title+'</h3>');
        if (el.image) $annotation.append('<img src="'+el.image+'" alt="'+el.imageAlt+'" />');
        if (el.text) $annotation.append('<p>'+el.text+'</p>');
        $container.append($annotation);
        $els.push($annotation)
      });

      _this.annotations[i].$els = $els;
    });
  };

  Content.prototype.update = function(annotation){
    $(".annotation").removeClass('active');

    if (!annotation) return false;

    var i = annotation.index;
    _.each(this.annotations[i].$els, function($el,i){
      $el.addClass('active');
    });
  };

  return Content;

})();
