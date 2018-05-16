$(function() {
  $.when(
    $.getJSON("config/base.json"),
    $.getJSON("config/physical.json"),
    $.getJSON("../temperature-forcings/config/physical.json"),
    $.getJSON("content/content.json"),
    $.getJSON("data/current.json")

  ).done(function(baseConfig, config, configSibling, content, data){
    baseConfig = baseConfig[0];
    _.extend(config[0].controls, configSibling[0].controls);
    config = _.extend({}, baseConfig, config[0]);
    content = content[0];
    data = data[0];

    console.log('Config loaded.');
    var app = new AppForcings(config, content, data);
  });
});
