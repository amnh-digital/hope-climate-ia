$(function() {
  $.when(
    $.getJSON("config/base.json"),
    $.getJSON("config/physical.json"),
    $.getJSON("../system-ocean-atmosphere/config/physical.json"),
    $.getJSON("content/feedback.json"),
    $.getJSON("content/prompts.json"),
    $.getJSON("content/questions.json")

  ).done(function(baseConfig, config, configSibling, feedback, prompts, questions){
    baseConfig = baseConfig[0];
    // _.extend(config[0].controls, configSibling[0].controls);
    config = _.extend({}, baseConfig, config[0]);
    content = _.extend({}, feedback[0], prompts[0], questions[0]);

    console.log('Config loaded.');
    var app = new AppQuiz(config, content);
  });
});
