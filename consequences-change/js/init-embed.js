var CONFIG_BASE_FILE = (typeof CONFIG_BASE_FILE === 'undefined') ? "config/base.json" : CONFIG_BASE_FILE;
var CONFIG_FILE = (typeof CONFIG_FILE === 'undefined') ? "config/embed.json" : CONFIG_FILE;
var CONTENT_FILE = (typeof CONTENT_FILE === 'undefined') ? "content/content.json" : CONTENT_FILE;

$(function() {
  $.when(
    $.getJSON(CONFIG_BASE_FILE),
    $.getJSON(CONFIG_FILE),
    $.getJSON(CONTENT_FILE)

  ).done(function(baseConfig, config, content){
    baseConfig = baseConfig[0];
    updateColorsFromConfig(baseConfig);
    config = _.extend({}, baseConfig, config[0]);
    content = content[0];

    console.log('Config loaded.');
    var app = new AppChange(config, content);
  });
});
