$(function() {
  console.log("Initializing...")
  $.when(
    $.getJSON("config/config.json"),
    $.getJSON("content/content.json")

  ).done(function(config, content){
    config = config[0];
    content = content[0];
    $.extend(config, content);
    console.log('Config loaded.');
    var app = new App(config);
  });
});
