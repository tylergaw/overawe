var namespace = 'overawe/',
  isPlaying = true,
  sceneInterval = null,
  sceneQueue = 15000,
  curRouteIndex = 0,
  notFoundRoute = '404';

var routes = {
  'armed': function(initialState) {
    return {
      template: 'ident--armed'
    };
  },
  'find': function(initialState) {
    return {
      template: 'ident--find'
    };
  },
  '404': function(initialState) {
    return {
      template: 'ident--404'
    };
  }
};

var playableRoutes = Object.keys(routes).filter(function(key) {
  return key !== notFoundRoute;
});

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
    isPlaying = true;
    sceneInterval = setInterval(advance, sceneQueue);
  } else {
    sound.pause();
    target.classList.add(className);
    isPlaying = false;
    clearInterval(sceneInterval);
  }
}

function advance() {
  curRouteIndex++;

  if (curRouteIndex > playableRoutes.length - 1) {
    curRouteIndex = 0;
  }

  transitionTo(playableRoutes[curRouteIndex]);
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

function playSound(audio) {
  var ctx = new AudioContext(),
    distortion = ctx.createWaveShaper(),
    gainNode = ctx.createGain(),
    biquadFilter = ctx.createBiquadFilter();

  distortion.curve = makeDistortionCurve(5000);
  // This can only be 'none', '2x', '4x'
  distortion.oversample = '4x';

  biquadFilter.type = 'lowpass';
  biquadFilter.frequency.value = 15000;

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

function render(state) {
  var el = document.getElementById(state.template),
    clone = document.importNode(el.content, true),
    canvas = document.getElementById('canvas');

  clearInterval(sceneInterval);

  if (isPlaying) {
    sceneInterval = setInterval(advance, sceneQueue);
  }

  if (canvas.childNodes.length) {
    canvas.removeChild(canvas.querySelector('.ident'));
  }

  canvas.appendChild(clone);
  playSound(canvas.querySelector('.ident__audio'));
}

function transitionTo(routeName, state) {
  var route = routeName;

  if (routeName === 'random') {
    curRouteIndex = Math.floor(Math.random() * playableRoutes.length);
    route = playableRoutes[curRouteIndex];
  } else {
    curRouteIndex = playableRoutes.indexOf(route);

    if (curRouteIndex > -1) {
      route = playableRoutes[curRouteIndex];
    } else {
      route = notFoundRoute;
    }
  }

  window.history.pushState({}, '', route);
  render(routes[route](state));
}

function init() {
  var body = document.getElementsByTagName('body')[0],
    audio = window.location.search.indexOf('audio=false'),
    routeName = window.location.pathname.split(namespace)[1].replace('/', '') || 'random';

  body.addEventListener('keyup', bodyOnKeyup, false);
  body.addEventListener('click', makeItStop, false);

  transitionTo(routeName, {
    audio: audio
  });
}

window.addEventListener('load', init, false);
