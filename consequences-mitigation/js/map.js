'use strict';

var Map = (function() {
  function Map(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Map.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.$body = $('body');
    this.stories = _.map(this.opt.stories, function(story, i){
      return story.map;
    });
    this.loadView();
    this.onChange(0);
  };

  Map.prototype.loadView = function(){
    var $container = $('<div />');
    this.stories = _.map(this.stories, function(story, i){
      var $el = $('<div class="overlay '+story.className+'"><img src="'+story.image+'" /></div>');
      $container.append($el);
      story.$el = $el;
      return story;
    });
    this.$el.append($container);
  };

  Map.prototype.onChange = function(index){
    var prevStory = this.story;
    var story = this.stories[index];
    var $body = this.$body;

    if (prevStory) {
      prevStory.$el.removeClass('active');
      $body.removeClass(prevStory.className);
    }

    story.$el.addClass('active');
    $body.addClass(story.className);
    this.story = story;
  };

  return Map;

})();
