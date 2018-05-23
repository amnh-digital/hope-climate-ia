$(function() {
  $.when(
    $.getJSON("config/base.json"),
    $.getJSON("config/web.json"),
    $.getJSON("content/content.json"),
    $.getJSON("data/continents.json"),
    $.getJSON("data/colorGradientRainbow.json")

  ).done(function(baseConfig, config, content, geojson, colorData){
    baseConfig = baseConfig[0];
    config = _.extend({}, baseConfig, config[0]);
    content = content[0];
    var data = {};

    config.globe["geojson"] = geojson[0];
    config.colorKey["gradient"] = colorData[0];

    // temporary hack: check for localhost to load video locally or remote
    if (window.location.hostname !== "localhost") {
      _.each(config.globe.videos, function(v, i){
        config.globe.videos[i].url = "https://s3.amazonaws.com/brianfoo-amnh/" + v.url;
      });
    }

    console.log('Config loaded.');
    var app = new AppOceanAtmosphere(config, content, data);
  });
});
