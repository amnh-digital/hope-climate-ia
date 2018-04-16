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
    this.angleThreshold = this.opt.angleThreshold;
    this.angleDelta = 0;


    this.loadUI();
    this.onRotate(0);
  };

  Stories.prototype.loadUI = function(){
    var _this = this;
    var stories = this.stories;
    var $container = $("<div />");

    _.each(stories, function(story, i){
      var html = '';
      html += '<div id="'+story.id+'" class="story-wrapper">';
        html += '<div class="loading"><div class="loading-bar"></div></div>';
        html += '<div class="story">';
          html += '<div class="video-container">';
            html += '<img src="'+story.image+'" alt="'+story.title+' video placeholder" />';
            html += '<video src="'+story.video+'" preload="auto" crossorigin="anonymous" />';
          html += '</div>';
        html += '</div>';
        html += '<div class="progress"><div class="progress-bar"></div><div class="progress-text"></div></div>';
        html += '<div class="information"><h2>'+story.title+'</h2><p>'+story.description+'</p></div>';
      html += '</div>';
      var $story = $(html);
      if (story.className) $story.addClass(story.className);
      stories[i].index = i;
      stories[i].$el = $story;
      stories[i].$loadProgressBar = $story.find(".loading-bar").first();
      stories[i].$progressBar = $story.find(".progress-bar").first();
      stories[i].$progressText = $story.find(".progress-text").first();
      var $video = $story.find("video").first();
      var video = $video[0];
      stories[i].video = $video[0];

      video.load();
      video.onended = function() {
        _this.onVideoEnded(stories[i]);
      };

      $container.append($story);
    });

    this.$el.append($container);
  };

  Stories.prototype.onRotate = function(delta){
    var stories = this.stories;
    var count = this.storyCount;
    var angleThreshold = this.angleThreshold;
    var index = 0;
    var changed = false;

    // check to see if we reached the threshold for going to the next story
    var angleDelta = this.angleDelta + delta;
    var changed = Math.abs(angleDelta) >= angleThreshold;
    if (changed && angleDelta < 0) index = this.currentStoryIndex - 1;
    else if (changed) index = this.currentStoryIndex + 1;
    if (index < 0) index = count - 1;
    if (index >= count) index = 0;
    this.angleDelta = angleDelta;

    // first load
    if (this.currentStoryIndex < 0) {
      index = 0;
      changed = true;
    }

    if (changed) {
      if (this.story) {
        this.story.$el.removeClass('active playing');
        this.story.video.currentTime = 0;
        this.story.video.pause();
      }
      var story = stories[index];
      this.story = story;
      this.currentStoryIndex = index;
      story.$el.addClass('active');
      this.$document.trigger("sound.play.sprite", ["tick"]);

      this.playing = false;
      this.loadStart = new Date().getTime();
      this.loadEnd = this.loadStart + this.opt.loadingTime;
      this.loading = true;
      this.angleDelta = 0;
    }

    // var multiplier = 0.25;
    // var progress = value*count;
    // var half = count / 2.0;
    // _.each(stories, function(story, i){
    //   var distance = Math.abs(i - progress);
    //   if (distance > half) distance = count - distance;
    //   var scale = (1.0 - (distance/half)) * multiplier + 1.0;
    //   story.$el.css('transform', 'scale3d('+scale+','+scale+','+scale+')');
    //   story.$el.find('.story').text(distance.toFixed(3))
    // });

  };

  Stories.prototype.onVideoEnded = function(story){
    this.playing = false;
    story.$el.removeClass('playing');
    story.video.currentTime = 0;
    story.video.pause();
    // if (this.story && story.index === this.story.index) {
    //   this.loadStart = new Date().getTime();
    //   this.loadEnd = this.loadStart + this.opt.loadingTime;
    //   this.loading = true;
    // }
  };

  Stories.prototype.playStory = function(story){
    story.$el.addClass('playing');
    story.video.play();

  };

  Stories.prototype.render = function(){
    if (this.loading) {
      var now = new Date().getTime();
      var progress = UTIL.norm(now, this.loadStart, this.loadEnd);
      if (progress >=1) {
        progress = 1;
        this.loading = false;
        this.playing = true;
        this.playStory(this.story);
      }
      this.story.$loadProgressBar.css('transform', 'scale3d('+(1-progress)+',1,1)');
    }

    if (this.playing) {
      var video = this.story.video;
      var progress = 0;
      if (video.duration) progress = video.currentTime / video.duration;
      this.story.$progressBar.css('transform', 'scale3d('+progress+',1,1)');
      var durationString = this.story.durationString;
      if (!durationString) {
        durationString = UTIL.secondsToString(video.duration);
        this.story.durationString = durationString;
      }
      var progressText = UTIL.secondsToString(video.currentTime) + " / " + durationString;
      this.story.$progressText.text(progressText);
    }

  };

  return Stories;

})();
