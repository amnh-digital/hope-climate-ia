// helper function

const RADIUS = 20;

function degToRad(degrees) {
  var result = Math.PI / 180 * degrees;
  return result;
}

// setup of the canvas

var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');

var x = 50;
var y = 50;
var locked = false;

function canvasDraw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f00";
  ctx.beginPath();
  ctx.arc(x, y, RADIUS, 0, degToRad(360), true);
  ctx.fill();
}
canvasDraw();

// pointer lock object forking for cross browser

canvas.requestPointerLock = canvas.requestPointerLock ||
                            canvas.mozRequestPointerLock;

document.exitPointerLock = document.exitPointerLock ||
                           document.mozExitPointerLock;

canvas.onclick = function() {
  if (!locked) {
    console.log('requesting pointer lock via click...');
    canvas.requestPointerLock();
  } else {
    console.log('clicked, but already locked...');
  }
};

// pointer lock event listeners

// Hook pointer lock state change events for different browsers
document.addEventListener('pointerlockchange', lockChangeAlert, false);
// document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
// document.addEventListener("mousemove", updatePosition, false);

var message = document.getElementById('message');

function lockChangeAlert() {
  if (document.pointerLockElement === canvas ||
      document.mozPointerLockElement === canvas) {
    console.log('The pointer lock status is now locked');
    message.textContent = 'Locked';
    document.addEventListener("mousemove", updatePosition, false);
    locked = true;
  } else {
    console.log('The pointer lock status is now unlocked');
    message.textContent = 'Unlocked';
    document.removeEventListener("mousemove", updatePosition, false);
    locked = false;
    setTimeout(function(){
      if (!locked && AUTOLOCK) {
        console.log('auto-requesting pointer lock after unlock...');
        canvas.requestPointerLock();
      }
    }, 5000);
  }
}

setTimeout(function(){
  if (!locked && AUTOLOCK) {
    console.log('auto-requesting pointer lock via timeout...');
    canvas.requestPointerLock();
  }
}, 15000);

var tracker = document.getElementById('tracker');


var animation;
function updatePosition(e) {
  x += e.movementX;
  y += e.movementY;
  if (x > canvas.width + RADIUS) {
    x = -RADIUS;
  }
  if (y > canvas.height + RADIUS) {
    y = -RADIUS;
  }
  if (x < -RADIUS) {
    x = canvas.width + RADIUS;
  }
  if (y < -RADIUS) {
    y = canvas.height + RADIUS;
  }
  tracker.textContent = "X position: " + x + ", Y position: " + y;

  if (!animation) {
    animation = requestAnimationFrame(function() {
      animation = null;
      canvasDraw();
    });
  }
}
