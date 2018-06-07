$(function() {
  $.when(
    $.getJSON("../controls.json"),
    $.getJSON("config/base.json"),
    $.getJSON("config/physical.json"),
    $.getJSON("content/content.json"),
    $.getJSON("data/current.json")

  ).done(function(globalControls, baseConfig, config, content, data){
    baseConfig = baseConfig[0];
    updateColorsFromConfig(baseConfig);
    config = _.extend({}, baseConfig, config[0]);
    config.controls = _.extend({}, globalControls[0], config.controls);
    content = content[0];
    data = data[0];

    console.log('Config loaded.');
    var app = new AppTimescales(config, content, data);
  });
});
