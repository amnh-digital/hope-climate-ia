'use strict';

var FactBox = (function() {
  function FactBox(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  FactBox.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.branches = this.opt.network.slice(0);
    this.loadView();
  };

  FactBox.prototype.hide = function(){
    $(".fact-box.active").removeClass("active");
  };

  FactBox.prototype.loadView = function(){
    var $container = $("<div />");
    var _this = this;
    _.each(this.branches, function(branch, i){
      var image = branch.factbox.image ? branch.factbox.image : "img/factbox_placeholder.jpg";
      var caption = branch.factbox.description ? branch.factbox.description : "Aliquam erat volutpat. Phasellus vulputate tortor sagittis est commodo, sed congue ipsum facilisis. Maecenas lobortis arcu velit, quis fermentum massa viverra ut.";
      var $factbox = $('<div class="fact-box"><div class="inner"><div class="image"><img src="'+image+'" /></div><div class="caption">'+caption+'</div></div></div>');
      $container.append($factbox);
      _this.branches[i].factbox.$el = $factbox;
    });
    this.$el.append($container);
  };

  FactBox.prototype.reset = function(branch){
    var index = branch.index;
    this.branches[index].factbox.$el.find('.inner').css('opacity', 1);
  };

  FactBox.prototype.show = function(branch){
    var index = branch.index;
    this.hide();
    this.branches[index].factbox.$el.addClass('active');
  };

  FactBox.prototype.transition = function(amount){
    $(".fact-box.active .inner").css('opacity', amount);
  };

  return FactBox;

})();
