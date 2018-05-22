$(function() {
  $.when(
    $.getJSON("config/base.json"),
    $.getJSON("config/physical.json"),
    $.getJSON("content/content.json")

  ).done(function(baseConfig, config, content){
    baseConfig = baseConfig[0];
    updateColorsFromConfig(baseConfig);
    config = _.extend({}, baseConfig, config[0]);
    content = content[0];

    console.log('Config loaded.');
    var app = new AppChange(config, content);
  });
});
