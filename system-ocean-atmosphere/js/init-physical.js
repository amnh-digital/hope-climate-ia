$(function() {
  $.when(
    $.getJSON("../config/controls.json"),
    $.getJSON("config/base.json"),
    $.getJSON("config/physical.json"),
    $.getJSON("../system-quiz/config/physical.json"),
    $.getJSON("content/content.json"),
    $.getJSON("data/continents.json"),
    $.getJSON("data/colorGradientRainbow.json")

  ).done(function(globalControls, baseConfig, config, configSibling, content, geojson, colorData){
    baseConfig = baseConfig[0];
    updateColorsFromConfig(baseConfig);
    _.extend(config[0].controls, configSibling[0].controls);
    config = _.extend({}, baseConfig, config[0]);
    config.controls = _.extend({}, globalControls[0], config.controls);
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
