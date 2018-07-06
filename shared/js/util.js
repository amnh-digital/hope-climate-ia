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

  UTIL.distance = function(x0, y0, x1, y1) {
    return Math.hypot(x1-x0, y1-y0);
  };

  UTIL.easeInOutCubic = function (t) {
    return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1;
  };

  // higher amount = more bounce
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

  UTIL.easeOutQuad = function (t) {
    return t*(2-t);
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

  // Calculates line segment intersection
  UTIL.lineIntersect = function(A, B, E, F) {
    var ip, a1, a2, b1, b2, c1, c2;
    // calculate
    a1 = B.y-A.y; a2 = F.y-E.y;
    b1 = A.x-B.x; b2 = E.x-F.x;
    c1 = B.x*A.y - A.x*B.y; c2 = F.x*E.y - E.x*F.y;
    // det
    var det=a1*b2 - a2*b1;
    // if lines are parallel
    if (det == 0) { return false; }
    // find point of intersection
    var xip = (b1*c2 - b2*c1)/det;
    var yip = (a2*c1 - a1*c2)/det;
    // now check if that point is actually on both line
    // segments using distance
    if (Math.pow(xip - B.x, 2) + Math.pow(yip - B.y, 2) >
        Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2))
    { return false; }
    if (Math.pow(xip - A.x, 2) + Math.pow(yip - A.y, 2) >
        Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2))
    { return false; }
    if (Math.pow(xip - F.x, 2) + Math.pow(yip - F.y, 2) >
        Math.pow(E.x - F.x, 2) + Math.pow(E.y - F.y, 2))
    { return false; }
    if (Math.pow(xip - E.x, 2) + Math.pow(yip - E.y, 2) >
        Math.pow(E.x - F.x, 2) + Math.pow(E.y - F.y, 2))
    { return false; }
    // else it's on both segments, return it
    return [xip, yip];
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

  UTIL.lerpLine = function(x0, y0, x1, y1, mu) {
    var nx = x0 + (x1 - x0) * mu;
    var ny = y0 + (y1 - y0) * mu;
    return [nx, ny];
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

  UTIL.radians = function(angle) {
    return angle * (Math.PI / 180);
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

  UTIL.random = function(low, high) {
    return UTIL.lerp(low, high, Math.random());
  };

  UTIL.round = function(value, precision) {
    return +value.toFixed(precision);
  };

  UTIL.roundToNearest = function(value, nearest) {
    return Math.round(value / nearest) * nearest;
  };

  UTIL.secondsToString = function(seconds){
    if (!seconds) return "0:00";
    var d = new Date(null);
    d.setSeconds(seconds);
    var start = 11;
    var len = 8;
    if (seconds < 3600) {
      start = 14;
      len = 5;
    }
    return d.toISOString().substr(start, len);
  };

  // East = 0 degrees
  UTIL.translatePoint = function(p, degrees, distance) {
    var radians = degrees * (Math.PI / 180);
    var x2 = p[0] + distance * Math.cos(radians);
    var y2 = p[1] + distance * Math.sin(radians);
    return [x2, y2];
  };

  UTIL.within = function(num, min, max) {
    if (num < min) return false;
    if (num > max) return false;
    return true;
  };

})();
