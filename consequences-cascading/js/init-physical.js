$(function() {
  $.when(
    $.getJSON("config/base.json"),
    $.getJSON("config/physical.json"),
    $.getJSON("../consequences-mitigation/config/physical.json"),
    $.getJSON("content/content.json"),
    $.getJSON("data/latest.json")

  ).done(function(baseConfig, config, configSibling, content, data){
    baseConfig = baseConfig[0];
    updateColorsFromConfig(baseConfig);
    _.extend(config[0].controls.pointerlockMappings, configSibling[0].controls.pointerlockMappings);
    config = _.extend({}, baseConfig, config[0]);
    config.controls.autolock = false;
    delete config.controls.pointerlockMappings; // disabled controls; this will be controlled by sibling
    content = content[0];
    data = data[0];

    console.log('Config loaded.');
    var app = new AppCascading(config, content, data);
  });
});
