$(function() {
  $.when(
    $.getJSON("config/base.json"),
    $.getJSON("config/physical.json"),
    $.getJSON("content/content.json"),
    $.getJSON("data/current.json")

  ).done(function(baseConfig, config, content, data){
    baseConfig = baseConfig[0];
    config = _.extend({}, baseConfig, config[0]);
    content = content[0];
    data = data[0];

    console.log('Config loaded.');
    var app = new AppTimescales(config, content, data);
  });
});
