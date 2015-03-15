var namespace = 'overawe/',
  isPlaying = true,
  playAudio = true,
  isSticky = false,
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
      duration: 5000,
      soundOpts: {
        curve: 50000,
        oversample: '3x',
        filterType: 'highpass',
        frequency: 500,
        playbackRate: 2.2
      }
    };
  },
  'find': function(initialState) {
    return {
      id: 'ident--find'
    };
  },
  'win': function(initialState) {
    return {
      id: 'ident--win',
      soundOpts: {
        curve: 5000,
        oversample: '4x',
        filterType: 'highpass',
        frequency: 100,
        playbackRate: 0.9
      }
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

    if (playAudio) {
      sound.play();
    }

    target.classList.remove(className);
    isPlaying = true;

    if (!isSticky) {
      sceneInterval = setInterval(advance, sceneQueue);
    }

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

  if (playAudio) {
    state.sound.play();
  }

  if (isPlaying && !isSticky) {
    sceneInterval = setInterval(advance, state.duration || sceneQueue);
  }
}

function transitionTo(routeName) {
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

  window.history.pushState({}, '', route + window.location.search);
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

function paramsStrToObj(str) {
  var obj = {},
    query = str.substr(1);

  query.split('&').forEach(function(part) {
    var item = part.split('=');
    obj[item[0]] = decodeURIComponent(item[1]);
  });

  return obj;
}

function getRouteName() {
  return window.location.pathname.split(namespace)[1].replace('/', '') || 'random';
}

function handlePopState(e) {
  transitionTo(getRouteName());
}

function init() {
  var body = document.getElementsByTagName('body')[0],
    params = paramsStrToObj(window.location.search);

  if (params.audio !== undefined) {
    playAudio = (params.audio === 'true');
  }

  isSticky = (params.sticky === 'true');

  populateStore();

  body.addEventListener('keyup', bodyOnKeyup, false);
  body.addEventListener('click', makeItStop, false);
  window.onpopstate = handlePopState;

  transitionTo(getRouteName());
}

window.addEventListener('load', init, false);
