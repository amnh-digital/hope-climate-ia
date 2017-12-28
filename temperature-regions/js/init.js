$(function() {
  $.getJSON("config/config.json", function(data) {
    console.log('Config loaded.');
    var app = new App(data);
  });
});
