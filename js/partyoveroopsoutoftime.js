var namespace = 'overawe/',
  isPlaying = true,
  sceneInterval = null,
  sceneQueue = 15000,
  curRouteIndex = 0,
  notFoundRoute = '404',
  canvas = document.getElementById('canvas'),
  store = {};

var routes = {
  'armed': function(initialState) {
    return {
      id: 'ident--armed',
      soundOpts: {
        curve: 20000,
        oversample: '2x',
        filterType: 'highpass',
        frequency: 1000,
        playbackRate: 2.5
      }
    };
  },
  'find': function(initialState) {
    return {
      id: 'ident--find'
    };
  },
  '404': function(initialState) {
    return {
      id: 'ident--404'
    };
  }
};

var playableRoutes = Object.keys(routes).filter(function(key) {
  return key !== notFoundRoute;
});

function makeItStop() {
  var target = document.getElementsByTagName('body')[0],
    className = 'paused',
    sound = store[playableRoutes[curRouteIndex]].sound;

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

function createSound(audio, opts) {
  var ctx = new AudioContext(),
    distortion = ctx.createWaveShaper(),
    gainNode = ctx.createGain(),
    biquadFilter = ctx.createBiquadFilter();

  distortion.curve = makeDistortionCurve(opts.curve || 5000);
  // This can only be 'none', '2x', '4x'
  distortion.oversample = opts.oversample || '4x';

  biquadFilter.type = opts.filterType || 'lowpass';
  biquadFilter.frequency.value = opts.frequency || 15000;

  audio.loop = true;
  audio.playbackRate = opts.playbackRate || 0.5;

  var src = ctx.createMediaElementSource(audio);
  src.connect(biquadFilter);
  biquadFilter.connect(gainNode);
  gainNode.connect(distortion);
  distortion.connect(ctx.destination);

  return audio;
}

function bodyOnKeyup(e) {
  // Spacebar play/pause
  if (e.keyCode === 32) {
    makeItStop();
  }
}

function render(state) {
  clearInterval(sceneInterval);

  [].forEach.call(document.querySelectorAll('.ident:not(.hidden)'), function(activeEl) {
    var id = activeEl.getAttribute('id');
    store[id].el.classList.add('hidden');
    store[id].el.classList.add('paused');
    store[id].sound.pause();
  });

  state.el.classList.remove('hidden');
  state.el.classList.remove('paused');
  state.sound.play();

  if (isPlaying) {
    sceneInterval = setInterval(advance, sceneQueue);
  }
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
  render(store[route]);
}

function populateStore() {
  playableRoutes.forEach(function(key) {
    var curStore = routes[key]();
    curStore.el = document.getElementById(key);
    curStore.sound = createSound(curStore.el.querySelector('.ident__audio'),
      curStore.soundOpts || {});
    store[key] = curStore;
  });
}

function init() {
  var body = document.getElementsByTagName('body')[0],
    audio = window.location.search.indexOf('audio=false'),
    routeName = window.location.pathname.split(namespace)[1].replace('/', '') || 'random';

  populateStore();

  body.addEventListener('keyup', bodyOnKeyup, false);
  body.addEventListener('click', makeItStop, false);

  transitionTo(routeName, {
    audio: audio
  });
}

window.addEventListener('load', init, false);
