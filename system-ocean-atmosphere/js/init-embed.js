$(function() {
  $.when(
    $.getJSON("config/base.json"),
    $.getJSON("config/embed.json"),
    $.getJSON("content/content.json"),
    $.getJSON("data/continents.json"),
    $.getJSON("data/colorGradientRainbow.json")

  ).done(function(baseConfig, config, content, geojson, colorData){
    baseConfig = baseConfig[0];
    updateColorsFromConfig(baseConfig);
    config = _.extend({}, baseConfig, config[0]);
    content = content[0];
    var data = {};

    config.globe["geojson"] = geojson[0];
    config.colorKey["gradient"] = colorData[0];

    _.each(config.videos, function(v, i){
      config.videos[i].url = "https://s3.amazonaws.com/brianfoo-amnh/" + v.url;
    });

    console.log('Config loaded.');
    var app = new AppOceanAtmosphere(config, content, data);
  });
});
