$(function() {
  $.when(
    $.getJSON("config/base.json"),
    $.getJSON("config/web.json"),
    $.getJSON("content/content.json")

  ).done(function(baseConfig, config, content){
    baseConfig = baseConfig[0];
    config = _.extend({}, baseConfig, config[0]);
    content = content[0];

    console.log('Config loaded.');
    var app = new AppQuiz(config, content);
  });
});
