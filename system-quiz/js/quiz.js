'use strict';

var Quiz = (function() {
  function Quiz(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  function questionToHtml(q){
    var id = q.id;

    var $question = $('<div class="quiz-question" id="'+id+'"></div>');

    var html = '<div class="q">'+q.q+'</div>';
    if (q.htmlBefore) html += q.htmlBefore;
    html += '<div class="as">';
    _.each(q.a, function(a){
      var className = a.className ? "a " + a.className : "a";
      if (a.isCorrect) className += " correct";
      var htmlBefore = a.htmlBefore || '';
      var htmlAfter = a.htmlAfter || '';
      html += '<div class="'+className+'">';
        html += '<div class="label-wrapper">'+htmlBefore+'<div class="label"><div class="label-text">'+a.label+'</div></div>'+htmlAfter+'</div>';
        if (a.feedback) html += '<div class="feedback">'+a.feedback+'</div>';
      html += '</div>'
    });
    if (q.htmlAfter) html += q.htmlAfter;
    html += '</div>';
    $question.html(html);

    return $question;
  }

  Quiz.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.$body = $('body');
    this.loadUI();
    this.restart();
  };

  Quiz.prototype.cont = function(){
    this.$progressContainer.addClass('active');
    this.next(0);
  };

  Quiz.prototype.done = function(){
    // alert('Done!');

    this.updateResults();
    this.prompt('restart');

    // this.reset();
  };

  Quiz.prototype.loadUI = function(){

    // load questions
    var $container = $('<div class="quiz-questions"></div>');
    var questions = _.map(this.opt.questions, function(q, i){
      var $question = questionToHtml(q);
      $container.append($question);
      q.$el = $question;
      return q;
    });
    this.questions = questions;
    this.questionCount = questions.length;
    this.$el.append($container);

    // load prompts
    $container = $('<div class="quiz-prompts"></div>');
    var prompts = _.mapObject(this.opt.prompts, function(p, key){
      var $prompt = questionToHtml(p);
      $container.append($prompt);
      p.$el = $prompt;
      p.isPrompt = true;
      return p;
    });
    this.prompts = prompts;
    this.$el.append($container);
    $('#question-count').text(this.questionCount);

    // load progress
    var $progress = $('<div class="progress">Question <span id="current">1</span> of <span class="total">'+questions.length+'</span></div>');
    this.$el.append($progress);
    this.$progressContainer = $progress;
    this.$progress = $progress.find("#current").first();

    return questions;
  };

  Quiz.prototype.next = function(inc){
    inc = inc===undefined ? 1 : inc;
    this.currentIndex += inc;

    // we're done
    if (this.currentIndex >= this.questionCount) {
      this.done();
      this.currentIndex = -1;
      return;
    }

    if (this.currentIndex < 0) this.currentIndex = 0;

    if (this.activeQuestion) {
      this.activeQuestion.$el.removeClass('active');
    }

    this.$progress.text(this.currentIndex + inc);

    this.activeQuestion = this.questions[this.currentIndex];
    this.activeQuestion.$el.addClass('active');
    this.$body.attr('question', this.activeQuestion.id);
  };

  Quiz.prototype.onAnswer = function(value){
    if (this.answered) return false;

    if (this.activeQuestion.isPrompt) {
      this.onAnswerPrompt(value);
      return false;
    }

    var _this = this;
    var index = parseInt(value);
    var $el = this.activeQuestion.$el;
    var $body = this.$body;

    var answer = this.activeQuestion.a[index];
    var $answers = $el.find('.a');
    var $answer = $($answers[index]);
    var className = answer.isCorrect ? "correct" : "incorrect";
    $answer.addClass('active');

    $el.addClass('answered '+className);

    if (answer.isCorrect) this.correctCount += 1;

    // var sound = answer.isCorrect ? "correct" : "incorrect";
    // $(document).trigger("sound.play.sprite", [sound]);

    this.answered = true;

    setTimeout(function(){
      $body.attr('question', '');
      _this.next();
      _this.answered = false;
      $answer.removeClass('active');
      setTimeout(function(){
        $el.removeClass('answered '+className);
      }, 1000);
    }, this.opt.answerWaitMs);
  };

  Quiz.prototype.onAnswerPrompt = function(value){
    var _this = this;
    var index = parseInt(value);
    var $el = this.activeQuestion.$el;
    var answer = this.activeQuestion.a[index];
    var $answers = $el.find('.a');
    var $answer = $($answers[index]);
    $answer.addClass('active');
    $el.addClass('answered');

    this.answered = true;

    var delay = answer.delay || 2000;

    setTimeout(function(){
      if (answer.action) {
        _this[answer.action](answer);
      }
      _this.answered = false;
      $answer.removeClass('active');
      setTimeout(function(){
        $el.removeClass('answered');
      }, 1000);
    }, delay);
  };

  Quiz.prototype.onResize = function(){

  };

  Quiz.prototype.prompt = function(key){
    // hard-coded: don't override start screen
    if (key !== "start" && this.activeQuestion.id === "p-start") return;

    this.$progressContainer.removeClass('active');

    if (this.activeQuestion) {
      this.activeQuestion.$el.removeClass('active');
    }

    this.activeQuestion = this.prompts[key];

    if (this.activeQuestion.action) {
      this[this.activeQuestion.action]();
    }

    this.activeQuestion.$el.addClass('active');
  };

  Quiz.prototype.reset = function(){
    // this.shuffle();
    this.currentIndex = -1;
    this.correctCount = 0;
    this.$progressContainer.addClass('active');
    this.next();
  };

  Quiz.prototype.restart = function(){
    this.currentIndex = -1;
    this.correctCount = 0;
    this.prompt("start");
  };

  Quiz.prototype.restartRespond = function(answer) {
    var _this = this;

    setTimeout(function(){ _this.reset(); }, 2000);
  };

  Quiz.prototype.shuffle = function(){
    this.questions = _.shuffle(this.questions);
  };

  Quiz.prototype.updateResults = function(){
    var feedback = this.opt.feedback;
    var last = feedback[feedback.length-1];
    var message = last.message || "";
    var messageAfter = last.messageAfter || "";

    var correct = this.correctCount / this.questionCount;
    var res = _.find(feedback, function(f){ return correct >= f.correct; });
    if (res) {
      message = res.message || "";
      messageAfter = res.messageAfter || "";
    }

    $('#correct-feedback').text(message);
    $('#correct-feedback-after').text(messageAfter);
    $('#correct-count').text(this.correctCount);
  };

  return Quiz;

})();
