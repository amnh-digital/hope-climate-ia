$(function() {
  $.when(
    $.getJSON("config/base.json"),
    $.getJSON("config/physical.json"),
    $.getJSON("../consequences-cascading/config/physical.json"),
    $.getJSON("content/content.json"),
    $.getJSON("data/latest.json")

  ).done(function(baseConfig, config, configSibling, content, data){
    baseConfig = baseConfig[0];
    _.extend(config[0].controls.pointerlockMappings, configSibling[0].controls.pointerlockMappings);
    config = _.extend({}, baseConfig, config[0]);
    content = content[0];
    data = data[0];

    // temporary hack: check for localhost to load video locally or remote
    if (window.location.hostname !== "localhost") {
      _.each(content.stories, function(s, i){
        content.stories[i].video = "https://s3.amazonaws.com/brianfoo-amnh/" + v.video;
      });
    }

    console.log('Config loaded.');
    var app = new AppMitigation(config, content, data);
  });
});
