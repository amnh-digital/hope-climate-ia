'use strict';

var AppQuiz = (function() {

  function AppQuiz(config, content) {
    var defaults = {};
    this.opt = _.extend({}, defaults, config);
    this.content = content;

    this.init();
  }

  AppQuiz.prototype.init = function(){
    var _this = this;

    var controlPromise = this.loadControls();
    var soundPromise = this.loadSounds();

    $.when.apply($, [controlPromise, soundPromise]).then(function(){
      _this.onReady();
    });
  };

  AppQuiz.prototype.loadControls = function(){
    var _this = this;

    var controls = new Controls(this.opt.controls);

    return controls.load();
  };

  AppQuiz.prototype.loadListeners = function(){
    var _this = this;
    var $document = $(document);

    var buttonDown = function(e, value) {
      _this.onButtonDown(value);
    };
    var resize = function(){
      _this.onResize();
    };

    $document.on("controls.button.down", buttonDown);
    $(window).on('resize', resize);

    var sleepStart = function(e, vars) {
      var prompt = vars.prompt || "start";
      _this.quiz.prompt(prompt);
    };
    $(document).on("sleep.start", sleepStart);
  };

  AppQuiz.prototype.loadSounds = function(){
    var _this = this;

    var sound = new Sound(this.opt.sound);

    return sound.load();
  };

  AppQuiz.prototype.onReady = function(){
    var d = this.data;

    var opt = _.extend({}, this.opt.quiz, this.content);

    // Initialize quiz
    this.quiz = new Quiz(opt);

    // Init sleep mode utilitys
    opt = _.extend({}, this.opt.sleep);
    this.sleep = new Sleep(opt);
    opt = _.extend({}, this.opt.check);
    this.check = new Sleep(opt);

    this.loadListeners();

    // this.render();
  };

  AppQuiz.prototype.onResize = function(){
    this.quiz.onResize();
  };

  AppQuiz.prototype.onButtonDown = function(value) {
    console.log("Button down " + value);
    this.quiz.onAnswer(value);
    this.check.wakeUp();
    this.sleep.wakeUp();
  };

  AppQuiz.prototype.render = function(){
    var _this = this;

    this.quiz.render();

    requestAnimationFrame(function(){ _this.render(); });
  };

  return AppQuiz;

})();
