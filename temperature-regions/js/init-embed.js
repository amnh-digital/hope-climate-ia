var ASSET_URL = (typeof ASSET_URL === 'undefined') ? "" : ASSET_URL;

$(function() {
  $.when(
    $.getJSON(ASSET_URL+"config/base.json"),
    $.getJSON(ASSET_URL+"config/embed.json"),
    $.getJSON(ASSET_URL+"content/content.json"),
    $.getJSON(ASSET_URL+"data/current.json")

  ).done(function(baseConfig, config, content, data){
    baseConfig = baseConfig[0];
    updateColorsFromConfig(baseConfig);
    config = _.extend({}, baseConfig, config[0]);
    content = content[0];
    data = data[0];

    console.log('Config loaded.');
    var app = new AppRegions(config, content, data);
  });
});
