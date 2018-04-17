'use strict';

var Stories = (function() {

  function Stories(options, stories) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init(stories);
  }

  Stories.prototype.init = function(stories){
    this.$el = $(this.opt.el);
    this.stories = stories;

    this.loadUI();
    this.onChange(0);
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

  Stories.prototype.onChange = function(index){
    // pause previous story
    if (this.story) {
      this.story.$el.removeClass('active playing');
      this.story.video.currentTime = 0;
      this.story.video.pause();
    }

    var story = this.stories[index];
    this.story = story;
    story.$el.addClass('active');

    this.playing = false;
    this.loadStart = new Date().getTime();
    this.loadEnd = this.loadStart + this.opt.loadingTime;
    this.loading = true;
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
