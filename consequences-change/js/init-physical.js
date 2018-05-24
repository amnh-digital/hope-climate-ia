$(function() {
  $.when(
    $.getJSON("../config/controls.json"),
    $.getJSON("config/base.json"),
    $.getJSON("config/physical.json"),
    $.getJSON("content/content.json")

  ).done(function(globalControls, baseConfig, config, content){
    baseConfig = baseConfig[0];
    updateColorsFromConfig(baseConfig);
    config = _.extend({}, baseConfig, config[0]);
    config.controls = _.extend({}, globalControls[0], config.controls);
    content = content[0];

    console.log('Config loaded.');
    var app = new AppChange(config, content);
  });
});
