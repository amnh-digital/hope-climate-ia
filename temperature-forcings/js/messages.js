'use strict';

var Messages = (function() {
  function Messages(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Messages.prototype.init = function(){
    var $el = $(this.opt.el);
    this.forcings = this.opt.forcings;

    var $messages = {};
    var $wrapper = $('<div/>');
    _.each(this.forcings, function(forcing, key){
      var $message = $('<div id="message-'+key+'" class="message"></div>');
      $message.append('<h3>'+forcing.title+'</h3>');
      $message.append('<p>'+forcing.sub+'</p>');
      $message.css({
        background: forcing.color,
        top: forcing.y * 100 + '%',
        left: forcing.x * 100 + '%'
      });
      $wrapper.append($message);
      $messages[key] = $message;
    });
    $el.append($wrapper);
    this.$messages = $messages;
  };

  Messages.prototype.forcingOff = function(value){
    this.$messages[value].removeClass('active');
  };

  Messages.prototype.forcingOn = function(value){
    this.$messages[value].addClass('active');
  };

  return Messages;

})();
