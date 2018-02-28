$(function() {
  $.when(
    $.getJSON("config/base.json"),
    $.getJSON("config/web.json"),
    $.getJSON("content/content.json"),
    $.getJSON("data/countries_states.geojson"),
    $.getJSON("data/colorGradientRainbow.json")

  ).done(function(baseConfig, config, content, geojson, colorData){
    baseConfig = baseConfig[0];
    config = _.extend({}, baseConfig, config[0]);
    content = content[0];
    var data = {};

    config.globe["geojson"] = geojson[0];
    config.colorKey["gradient"] = colorData[0];

    console.log('Config loaded.');
    var app = new AppOceanAtmosphere(config, content, data);
  });
});
