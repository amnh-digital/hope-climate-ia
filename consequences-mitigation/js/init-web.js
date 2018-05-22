$(function() {
  $.when(
    $.getJSON("config/base.json"),
    $.getJSON("config/web.json"),
    $.getJSON("content/content.json"),
    $.getJSON("data/latest.json")

  ).done(function(baseConfig, config, content, data){
    baseConfig = baseConfig[0];
    config = _.extend({}, baseConfig, config[0]);
    content = content[0];
    data = data[0];

    // temporary hack: check for localhost to load video locally or remote
    if (window.location.hostname !== "localhost") {
      _.each(config.stories, function(s, i){
        config.stories[i].video = "https://s3.amazonaws.com/brianfoo-amnh/" + s.video;
      });
    }

    console.log('Config loaded.');
    var app = new AppMitigation(config, content, data);
  });
});
