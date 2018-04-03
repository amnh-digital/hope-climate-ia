'use strict';

var Stories = (function() {

  function Stories(options, stories) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init(stories);
  }

  Stories.prototype.init = function(stories){
    this.$document = $(document);
    this.$el = $(this.opt.el);
    this.stories = stories;
    this.storyCount = stories.length;
    this.currentStoryIndex = -1;

    this.loadUI();
    this.onRotate(0);
  };

  Stories.prototype.loadUI = function(){
    var stories = this.stories;
    var $container = $("<div />");

    _.each(stories, function(story, i){
      var html = '';
      html += '<div id="'+story.id+'" class="story-wrapper">';
        html += '<div class="story">';
        html += '</div>';
      html += '</div>';
      var $story = $(html);
      stories[i].$el = $story;
      stories[i].index = i;
      $container.append($story);
    });

    this.$el.append($container);
  };

  Stories.prototype.onRotate = function(value){
    var stories = this.stories;
    var count = this.storyCount;
    var segment = 1.0 / count;

    value += segment/2;
    if (value >= 1.0) value -= 1.0;

    var progress = value * count;
    var index = parseInt(Math.floor(progress));
    var story = stories[index];
    var changed = (!this.story || this.story.index !== index);

    if (changed) {
      if (this.story) {
        this.story.$el.removeClass('active');
      }
      this.story = story;
      story.$el.addClass('active');
      this.$document.trigger("sound.play.sprite", ["tick"]);
    }

    // var multiplier = 0.25;
    // _.each(stories, function(story, i){
    //   var j = i + count - 1;
    //   var k = i - (count - 1);
    //   var distance = Math.min(Math.abs(i-progress), Math.abs(j-progress), Math.abs(k-progress));
    //   distance /= count;
    //   distance *= 2;
    //   // console.log(distance)
    //   var size = (1.0 - distance) * multiplier;
    //   var scale = 1.0 + size;
    //   story.$el.css('transform', 'scale3d('+scale+','+scale+','+scale+')');
    // });


  };

  return Stories;

})();
