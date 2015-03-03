var sound = {
  play: function(){},
  pause: function(){}
};

function makeItStop() {
  var target = document.getElementsByTagName('body')[0],
    className = 'paused';

  if (target.classList.contains(className)) {
    sound.play();
    target.classList.remove(className);
  } else {
    sound.pause();
    target.classList.add(className);
  }
}

function makeDistortionCurve(amount) {
  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 45100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }

  return curve;
};

function playSound() {
  var ctx = new webkitAudioContext(),
    distortion = ctx.createWaveShaper(),
    gainNode = ctx.createGain(),
    biquadFilter = ctx.createBiquadFilter();

  distortion.curve = makeDistortionCurve(5000);
  // This can only be 'none', '2x', '4x'
  distortion.oversample = '4x';

  biquadFilter.type = 'lowpass';
  biquadFilter.frequency.value = 15000;

  var audio = document.querySelector('.ident__audio');
  audio.autoplay = true;
  audio.loop = true;
  audio.playbackRate = 0.5;
  sound = audio;

  var src = ctx.createMediaElementSource(audio);
  src.connect(biquadFilter);
  biquadFilter.connect(gainNode);
  gainNode.connect(distortion);
  distortion.connect(ctx.destination);
}

function bodyOnKeyup(e) {
  // Spacebar play/pause
  if (e.keyCode === 32) {
    makeItStop();
  }
}

function init() {
  var bod = document.getElementsByTagName('body')[0],
    audio = window.location.search.indexOf('audio=false');

  if (audio < 0) {
    playSound();
  }

  bod.addEventListener('keyup', bodyOnKeyup, false);
  bod.addEventListener('click', makeItStop, false);
}

window.addEventListener('load', init, false);
