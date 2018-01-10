$(function() {
  $.when(
    $.getJSON("config/config.json"),
    $.getJSON("content/messages.json")

  ).done(function(config, messages){
    config = config[0];
    messages = messages[0];
    $.extend(config.messages, messages);
    console.log('Config loaded.');
    var app = new App(config);
  });
});
