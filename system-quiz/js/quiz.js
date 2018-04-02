'use strict';

var Quiz = (function() {
  function Quiz(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Quiz.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.questions = this.loadQuestions(this.opt.questions);
    this.questionCount = this.questions.length;
    this.reset();
  };

  Quiz.prototype.done = function(){
    // alert('Done!');

    this.reset();
  };

  Quiz.prototype.loadQuestions = function(questions){
    var $container = $('<div class="quiz-questions"></div>');

    questions = _.map(questions, function(q, i){
      var id = 'q'+i;
      if (q.id) id = q.id;

      var $question = $('<div class="quiz-question" id="'+id+'"></div>');

      var html = '<div class="q">'+q.q+'</div>';
      html += '<div class="as">';
      _.each(q.a, function(a){
        var className = "a";
        if (a.isCorrect) className += " correct";
        html += '<div class="'+className+'">';
          html += '<div class="label-wrapper"><div class="label">'+a.label+'</div></div>';
          html += '<div class="feedback">'+a.feedback+'</div>';
        html += '</div>'
      });
      html += '</div>';

      $question.html(html);
      $container.append($question);

      q.id = id;
      q.$el = $question;
      return q;
    });

    this.$el.append($container);

    var $progress = $('<div class="progress">Question <span id="current">1</span> of <span class="total">'+questions.length+'</span></div>');
    this.$el.append($progress);
    this.$progress = $progress.find("#current").first();

    return questions;
  };

  Quiz.prototype.next = function(){
    this.currentIndex += 1;

    // we're done
    if (this.currentIndex >= this.questionCount) {
      this.done();
      this.currentIndex = -1;
      return;
    }

    if (this.activeQuestion) {
      this.activeQuestion.$el.removeClass('active');
    }

    this.$progress.text(this.currentIndex + 1);

    this.activeQuestion = this.questions[this.currentIndex];
    this.activeQuestion.$el.addClass('active');

  };

  Quiz.prototype.onAnswer = function(value){
    if (this.answered) return false;

    var _this = this;
    var index = parseInt(value);
    var $el = this.activeQuestion.$el;

    var answer = this.activeQuestion.a[index];
    var $answers = $el.find('.a');
    var $answer = $($answers[index]);
    $answer.addClass('active');

    $el.addClass('answered');

    var sound = answer.isCorrect ? "correct" : "incorrect";
    $(document).trigger("sound.play.sprite", [sound]);

    this.answered = true;

    setTimeout(function(){
      _this.next();
      _this.answered = false;
      $answer.removeClass('active');
      $el.removeClass('answered');
    }, 5000);
  };

  Quiz.prototype.onResize = function(){

  };

  Quiz.prototype.reset = function(){
    this.shuffle();
    this.currentIndex = -1;
    this.next();
  };

  Quiz.prototype.shuffle = function(){
    this.questions = _.shuffle(this.questions);
  };

  return Quiz;

})();
