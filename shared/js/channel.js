'use strict';

var Channel = (function() {
  function Channel(name, options) {
    var defaults = {
      "role": "subscriber" // or publisher
    };

    this.opt = _.extend({}, defaults, options);
    this.init(name);
  }

  Channel.prototype.init = function(channelName){
    channelName = channelName || 'default';
    this.channel = new BroadcastChannel(channelName);
    this.role = this.opt.role;
    this.callbacks = {};
  };

  Channel.prototype.addCallback = function(topic, callback){
    this.callbacks[topic] = callback;
  };

  Channel.prototype.listen = function(){
    if (this.role !== "subscriber") return false;

    var channel = this.channel;
    var callbacks = this.callbacks;

    channel.onmessage = function (e) {
      var resp = e.data;
      var topic = resp.topic;
      var data = resp.data;

      if (callbacks[topic] !== undefined) callbacks[topic](data);
    };
  };

  Channel.prototype.post = function(topic, data){
    if (this.role !== "publisher") return false;

    this.channel.postMessage({
      "topic": topic,
      "data": data
    });
  };

  Channel.prototype.close = function(){
    this.channel.close();
  };

  return Channel;

})();
