$(function() {
  $.when(
    $.getJSON("config/config.json"),
    $.getJSON("content/content.json")

  ).done(function(config, content){
    config = config[0];
    content = content[0];
    config.messages["content"] = content["messages"];
    console.log('Config loaded.');
    var app = new App(config);
  });
});
