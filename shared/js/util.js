// Utility functions
(function() {
  window.UTIL = {};

  UTIL.ceilToNearest = function(value, nearest) {
    return Math.ceil(value / nearest) * nearest;
  };

  UTIL.clamp = function(value, min, max) {
    value = Math.min(value, max);
    value = Math.max(value, min);
    return value;
  };

  UTIL.easeInOutCubic = function (t) {
    return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1;
  };

  UTIL.easeInElastic = function (t, amount) {
    amount = amount || 0.04;
    return (amount - amount / t) * Math.sin(25 * t) + 1;
  };

  UTIL.easeInOutElastic = function (t) {
    return (t -= .5) < 0 ? (.01 + .01 / t) * Math.sin(50 * t) : (.02 - .01 / t) * Math.sin(50 * t) + 1;
  };

  UTIL.easeInOutSin = function (t) {
    return (1 + Math.sin(Math.PI * t - Math.PI / 2)) / 2;
  };

  UTIL.floorToNearest = function(value, nearest) {
    return Math.floor(value / nearest) * nearest;
  };

  UTIL.getQueryVariable = function(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (decodeURIComponent(pair[0]) == variable) {
        return decodeURIComponent(pair[1]);
      }
    }
    return false;
  };

  UTIL.lerp = function(a, b, percent) {
    return (1.0*b - a) * percent + a;
  };

  UTIL.lerpColor = function (a, b, amount) {
    var ah = a,
      ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
      bh = b,
      br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
      rr = ar + amount * (br - ar),
      rg = ag + amount * (bg - ag),
      rb = ab + amount * (bb - ab);

    return ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0);
  };

  UTIL.lerpList = function(l1, l2, amount) {
    var ll = [];
    for (var i=0; i<l1.length; i++) {
      ll.push(UTIL.lerp(l1[i], l2[i], amount));
    }
    return ll;
  };

  UTIL.lim = function(num, min, max) {
    if (num < min) return min;
    if (num > max) return max;
    return num;
  };

  UTIL.norm = function(value, a, b){
    return (1.0 * value - a) / (b - a);
  };

  UTIL.pad = function(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
  };

  UTIL.parseQuery = function() {
    var qstr = window.location.search.substring(1);
    var query = {};
    var a = (qstr[0] === '?' ? qstr.substr(1) : qstr).split('&');
    for (var i = 0; i < a.length; i++) {
      var b = a[i].split('=');
      query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
    }
    return query;
  };

  UTIL.round = function(value, precision) {
    return +value.toFixed(precision);
  };

  UTIL.within = function(num, min, max) {
    if (num < min) return false;
    if (num > max) return false;
    return true;
  };

})();
