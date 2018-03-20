'use strict';

var Messages = (function() {
  function Messages(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Messages.prototype.init = function(){
    var $el = $(this.opt.el);
    var messages = this.opt.messages.slice(0);

    var $messages = {};
    var $wrapper = $('<div/>');
    _.each(messages, function(message, i){
      var $message = $('<div id="message-'+i+'" class="message"><h3>'+message.label+'</h3><p>'+message.text+'</p></div>');
      $wrapper.append($message);
      messages[i].$el = $message;
    });
    $el.append($wrapper);

    this.messages = messages;
    this.currentMessage = -1;

    this.onZoneChange(this.opt.zone);
  };

  Messages.prototype.onZoneChange = function(value){
    var lat = UTIL.lerp(90, -90, value);
    var messages = this.messages;
    var currentMessage = this.currentMessage;

    var newMessage = 0;
    _.each(messages, function(m, i){
      if (lat >= m.lat[1] && lat < m.lat[0]) {
        newMessage = i;
      }
    });

    if (newMessage !== currentMessage) {
      $(".message").removeClass('active');
      messages[newMessage].$el.addClass('active');
      this.currentMessage = newMessage;
    }
  };

  return Messages;

})();
