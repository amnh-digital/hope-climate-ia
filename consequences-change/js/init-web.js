$(function() {
  $.when(
    $.getJSON("config/base.json"),
    $.getJSON("config/web.json"),
    $.getJSON("content/content.json"),
    $.getJSON("data/countries_states.geojson")

  ).done(function(baseConfig, config, content, data){
    baseConfig = baseConfig[0];
    config = _.extend({}, baseConfig, config[0]);
    content = content[0];
    data = data[0];

    console.log('Config loaded.');
    var app = new AppChange(config, content, data);
  });
});
