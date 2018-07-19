'use strict';

var Stories = (function() {

  function Stories(options, stories) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init(stories);
  }

  Stories.prototype.init = function(stories){
    this.$el = $(this.opt.el);
    this.$transformer = $(this.opt.transformer);
    this.$body = $('body');
    this.stories = stories;

    this.loadUI();
    this.onResize();
    this.onChange(0);
  };

  Stories.prototype.loadUI = function(){
    var _this = this;
    var stories = this.stories;
    var $container = $("<div />");

    _.each(stories, function(story, i){
      var rand = "?r=" + parseInt(Math.random() * 1000000); // add random string at the end to prevent cache
      var html = '';
      html += '<div id="'+story.id+'" class="story-wrapper">';
        html += '<div class="story-overlay"></div>';
        html += '<div class="story-content">';
          html += '<div class="loading"><div class="loading-bar"></div></div>';
          html += '<div class="story">';
            html += '<div class="video-container">';
              html += '<img src="'+story.image+'" alt="'+story.title+' video placeholder" />';
              if (story.videos) {
                html += '<video crossorigin="anonymous">';
                  _.each(story.videos, function(video){
                    html += '<source src="'+video.src+rand+'" type="'+video.type+'">';
                  });
                  if (story.captions) {
                    _.each(story.captions, function(caption, i){
                      var defaultString = "";
                      if (i<=0) defaultString = "default";
                      html += '<track label="'+caption.label+'" kind="subtitles" srclang="'+caption.srclang+'" src="'+caption.src+'" '+defaultString+'>';
                    });
                  }
                html += '</video>';
              }
            html += '</div>';
          html += '</div>';
          html += '<div class="progress"><div class="progress-bar"></div><div class="progress-text"></div></div>';
          html += '<div class="information"><div class="information-inner"><h2>'+story.title+'</h2>'+story.description+'</div></div>';
        html += '</div>';
      html += '</div>';
      var $story = $(html);
      if (story.className) $story.addClass(story.className);
      stories[i].index = i;
      stories[i].$el = $story;
      stories[i].$loadProgressBar = $story.find(".loading-bar").first();
      stories[i].$progressBar = $story.find(".progress-bar").first();
      stories[i].$progressText = $story.find(".progress-text").first();
      if (story.videos) {
        var $video = $story.find("video").first();
        var video = $video[0];
        var player = new Plyr(video, {
          controls: [],
          iconUrl: '../../img/vendor/plyr.svg',
          captions: {active: true, language: 'en'},
          resetOnEnd: true
        });
        // video.load();
        player.on('ended', function(){
          _this.onVideoEnded(stories[i]);
        });
        stories[i].video = player;
      }
      $container.append($story);
    });

    this.$el.append($container);
    this.stories = stories;
  };

  Stories.prototype.onChange = function(index){
    var firstLoad = true;

    // pause previous story
    if (this.story) {
      this.story.$el.removeClass('active playing');
      this.$body.removeClass('playing');
      if (this.story.video) {
        // this.story.video.currentTime = 0;
        // this.story.video.pause();
        this.story.video.stop();
      }
      firstLoad = false;
    }

    var story = this.stories[index];
    this.story = story;
    story.$el.addClass('active');

    if (firstLoad) {
      var scaleFactor = this.opt.scaleFactor;
      story.$el.css('transform', 'scale3d('+scaleFactor+','+scaleFactor+','+scaleFactor+')');
      this.$transformer.css('transform', 'translate3d('+story.dx+'px,'+story.dy+'px,0)');
    }

    this.queueCurrentStory();
  };

  Stories.prototype.onResize = function(){
    var stories = this.stories;

    // get parent dimensions
    var pw = this.$el.width();
    var ph = this.$el.height();
    var px = this.$el.offset().left;
    var py = this.$el.offset().top;
    var translateFactor = this.opt.translateFactor;

    var pcx = px + pw * 0.5;
    var pcy = py + ph * 0.5;

    // calculate positioning
    _.each(stories, function(story, i){
      var $el = story.$el;

      // determine the center of the story
      var top = $el.offset().top;
      var left = $el.offset().left;
      var w = $el.width();
      var h = $el.height();
      var cx = left + w * 0.5;
      var cy = top + h * 0.5;

      // translate the container slightly based on the centers of the story and the parent
      var lx = UTIL.lerp(cx, pcx, translateFactor);
      var ly = UTIL.lerp(cy, pcy, translateFactor);
      stories[i].dx = lx - cx;
      stories[i].dy = ly - cy;
    });

    this.stories = stories;
  };

  Stories.prototype.onVideoEnded = function(story){
    this.playing = false;
    story.$el.removeClass('playing');
    this.$body.removeClass('playing');
    // if (story.video) {
    //   story.video.currentTime = 0;
    //   story.video.pause();
    //   story.video.stop();
    // }
    // if (this.story && story.index === this.story.index) {
    //   this.loadStart = new Date().getTime();
    //   this.loadEnd = this.loadStart + this.opt.loadingMs;
    //   this.loading = true;
    // }
  };

  Stories.prototype.playStory = function(story){
    this.$body.addClass('playing');
    if (story.video) {
      story.$el.addClass('playing');
      story.video.play();
    }
  };

  Stories.prototype.queueCurrentStory = function(){
    this.playing = false;
    this.loadStart = new Date().getTime();
    this.loadEnd = this.loadStart + this.opt.loadingMs;
    this.loading = true;
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
      this.story.$loadProgressBar.css('transform', 'scale3d('+progress+',1,1)');
    }

    if (this.playing) {
      var video = this.story.video;
      var progress = 0;
      var progressText = "-:--";
      if (video && (video.currentTime || video.currentTime===0) && video.duration && video.duration > 0) {
        progress = video.currentTime / video.duration;
        progressText = '-'+UTIL.secondsToString(video.duration-video.currentTime);
      }
      this.story.$progressBar.css('transform', 'scale3d('+progress+',1,1)');
      // var durationString = this.story.durationString;
      // if (!durationString && video) {
      //   durationString = UTIL.secondsToString(video.duration);
      //   this.story.durationString = durationString;
      // }
      this.story.$progressText.text(progressText);
    }

  };

  Stories.prototype.transition = function(fromIndex, toIndex, mu){
    var stories = this.stories;
    var fromStory = stories[fromIndex];
    var toStory = stories[toIndex];

    var dx = UTIL.lerp(fromStory.dx, toStory.dx, mu);
    var dy = UTIL.lerp(fromStory.dy, toStory.dy, mu);

    var scaleFactor = this.opt.scaleFactor;
    var fromScale = UTIL.lerp(scaleFactor, 1, mu);
    var toScale = UTIL.lerp(1, scaleFactor, mu);

    fromStory.$el.css('transform', 'scale3d('+fromScale+','+fromScale+','+fromScale+')');
    toStory.$el.css('transform', 'scale3d('+toScale+','+toScale+','+toScale+')');
    this.$transformer.css('transform', 'translate3d('+dx+'px,'+dy+'px,0)');
  };

  return Stories;

})();
