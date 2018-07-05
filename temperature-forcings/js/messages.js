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

    var svgBg = function(w, h, radius){
      var points = [[0,h]]; // bottom left
      points.push([0,0]); // top left
      points.push([w,0]); // top right
      points.push([w,h-radius]); // bottom right radius 1
      points.push([w-radius,h]); // bottom right radius 2
      points.push([0,h]); // bottom left
      var pointsStr = _.map(points, function(xy){ return xy[0] + ' ' + xy[1]; });
      pointsStr = pointsStr.join(' ');
      return '<svg viewBox="0 0 '+w+' '+h+'"><polygon points="'+pointsStr+'"/></svg>';
    };

    var $messages = {};
    var $wrapper = $('<div/>');
    _.each(this.forcings, function(forcing, key){
      var className = '';
      if (forcing.sub.length > 180) className = 'large';

      var html = '<div id="message-'+key+'" class="message '+className+'">';
        html += '<img src="'+forcing.image+'" alt="'+forcing.title+'" />';
        if (className==='large')
          html += svgBg(392, 383, 35);
        else
          html += svgBg(392, 275, 35);
        html += '<div class="text"><h3 style="color: '+forcing.color+'">'+forcing.title+'</h3><p>'+forcing.sub+'</p></div>'
      html += '</div>';

      var $message = $(html);
      $message.css({
        top: forcing.y * 100 + '%',
        left: forcing.x * 100 + '%'
      });

      var $polygon = $message.find('polygon').first();
      $polygon.css({
        'fill': forcing.bgColor,
        'stroke': forcing.color
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
