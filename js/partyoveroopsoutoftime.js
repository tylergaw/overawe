var namespace = 'overawe/',
  isPlaying = true,
  playAudio = true,
  isSticky = false,
  sceneInterval = null,
  sceneDuration = 25000,
  curRouteIndex = 0,
  curRouteName = '',
  introRoute = 'intro',
  notFoundRoute = 'fourohfour',
  canvas = document.getElementById('canvas'),
  store = {},
  CtxClass = window.AudioContext || window.webkitAudioContext,
  ctx = new CtxClass(),
  isSafari = /^((?!chrome).)*safari/i.test(navigator.userAgent);

var base = document.querySelector("base");
var baseHref = base ? base.href : "";

function preload(imgs) {
  imgs.forEach(function(filename, index) {
    var img = new Image();
    img.src = 'images/' + filename;
  })
};

var routes = {
  'intro': function(initialState) {
    return {
      id: 'ident--intro',
      soundOpts: {
        curve: 250,
        oversample: '2x',
        filterType: 'lowpass',
        frequency: 1000,
        playbackRate: 0.9
      },
      onstart: function() {
        preload([
          'armed-bg-01.png',
          'armed-bg-extra-01.png',
          'armed-msg-01.png',
          'armed-subject-01.png'
        ]);
      }
    };
  },
  'armed': function(initialState) {
    return {
      id: 'ident--armed',
      duration: 12000,
      soundOpts: {
        curve: 50000,
        oversample: '2x',
        filterType: 'lowpass',
        frequency: 900,
        playbackRate: 1.5
      },
      onstart: function() {
        preload([
          'find-msg-01.jpg',
          'find-subject-01.png',
          'find-bg-01.jpg'
        ]);
      }
    };
  },
  'find': function(initialState) {
    return {
      id: 'ident--find',
      onstart: function() {
        preload([
          'win-bg-01.png',
          'win-bg-02.gif',
          'win-bg-paused.jpg',
          'win-msg-01.png',
          'win-subject-01.png'
        ]);
      }
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
      },
      onstart: function() {
        preload([
          'view-subject-01.png'
        ]);
      }
    };
  },
  'view': function(initialState) {
    return {
      id: 'ident--view',
      soundOpts: {
        curve: 1200,
        oversample: '4x',
        filterType: 'highpass',
        frequency: 1000,
        playbackRate: 0.9
      },
      onstart: function() {
        preload([
          'dog-bg-01.jpg',
          'dog-msg-01.png',
          'dog-subject-01.png',
          'dog-subject-02.png',
          'dog-subject-03.png',
          'dog-subject-04.png',
          'dog-subject-05.png'
        ]);
      }
    };
  },
  'dog': function(initialState) {
    return {
      id: 'ident--dog',
      duration: 30000,
      soundOpts: {
        curve: 500,
        oversample: '2x',
        filterType: 'lowpass',
        frequency: 900,
        playbackRate: 1
      },
      onstart: function() {
        preload([
          'precious-bg-01.gif',
          'precious-msg-01.png',
          'precious-subject-01.png'
        ]);
      }
    };
  },
  'precious': function(initialState) {
    return {
      id: 'ident--precious',
      soundOpts: {
        curve: 2000,
        oversample: '4x',
        filterType: 'highpass',
        frequency: 700,
        playbackRate: 1.1
      },
      onstart: function() {
        preload([
          'north-msg-01.png'
        ]);
      }
    };
  },
  'north': function(initialState) {
    return {
      id: 'ident--north',
      duration: 15000,
      soundOpts: {
        curve: 1000,
        oversample: '4x',
        filterType: 'lowpass',
        frequency: 20000,
        playbackRate: 1
      },
      onstart: function() {
        preload([
          'buy-bg-01.png',
          'buy-msg-01.gif',
          'buy-msg-paused.png'
        ]);
      }
    };
  },
  'buy': function(initialState) {
    return {
      id: 'ident--buy',
      duration: 15000,
      soundOpts: {
        curve: 200,
        oversample: '4x',
        filterType: 'highpass',
        frequency: 100,
        playbackRate: 1.5
      },
      onstart: function() {
        preload([
          'afi-msg.jpg'
        ]);
      }
    };
  },
  'afi': function(initialState) {
    return {
      id: 'ident--afi',
      duration: 17000,
      soundOpts: {
        curve: 300,
        oversample: '4x',
        filterType: 'lowpass',
        frequency: 2000,
        playbackRate: 1
      },
      onstart: function() {
        preload([
          'rise-bg-0.png',
          'rise-bg-01.jpg',
          'rise-msg.png'
        ]);
      }
    };
  },
  'rise': function(initialState) {
    return {
      id: 'ident--rise',
      duration: 34500,
      soundOpts: {
        curve: 1000,
        oversample: '4x',
        filterType: 'lowpass',
        frequency: 1500,
        playbackRate: 1
      },
      onstart: function() {
        preload([
          'fin-bg.jpg',
          'fin-msg.png'
        ]);
      }
    };
  },
  'fin': function(initialState) {
    return {
      id: 'ident--fin',
      duration: 8000,
      onend: function() {
        transitionTo('intro');
      }
    };
  },
  'fourohfour': function(initialState) {
    return {
      id: 'ident--fourohfour'
    };
  }
};

var playableRoutes = Object.keys(routes).filter(function(key) {
  return key !== notFoundRoute && key !== introRoute;
});

function makeItStop() {
  if (isStaticRoute(curRouteName)) {
    return false;
  }

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
      sceneInterval = setInterval(advance, sceneDuration);
    }
    document.title = '▶︎ ' + document.title.split(' ')[1];

  } else {
    if (sound) {
      sound.pause();
    }

    target.classList.add(className);
    isPlaying = false;
    clearInterval(sceneInterval);
    document.title = '❚❚ ' + document.title.split(' ')[1];
  }
}

function mute(e) {
  var sound = store[curRouteName].sound;
  var target = e.target;

  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (!isPlaying) {
    return false;
  }

  if (!sound.paused) {
    sound.pause();
    playAudio = false;
    target.innerHTML = 'muted';
  } else {
    sound.play();
    playAudio = true;
    target.innerHTML = 'mute';
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
  // Safari loses it's goddamn mind when trying to do any of this. Just don't even.
  if (!isSafari) {
    var distortion = ctx.createWaveShaper();
    var gainNode = ctx.createGain();
    var biquadFilter = ctx.createBiquadFilter();

    distortion.curve = makeDistortionCurve(opts.curve || 5000);
    // This can only be 'none', '2x', '4x'
    distortion.oversample = opts.oversample || '4x';

    biquadFilter.type = opts.filterType || 'lowpass';
    biquadFilter.frequency.value = opts.frequency || 15000;

    // This appears to be the source of the problem when ran in Safari. These all
    // exist, but cause Safari to become unresponsive and crash.
    var src = ctx.createMediaElementSource(audio);
    src.connect(biquadFilter);
    biquadFilter.connect(gainNode);
    gainNode.connect(distortion);
    distortion.connect(ctx.destination);
  }
  
  audio.crossOrigin = "anonymous";
  audio.loop = true;
  audio.playbackRate = opts.playbackRate || 0.5;
  return audio;
}

function bodyOnKeyup(e) {
  // Spacebar play/pause
  if (e.keyCode === 32) {
    makeItStop();
  }
}

function isStaticRoute(routeName) {
  return playableRoutes.indexOf(routeName) === -1;
}

function render(state) {
  clearInterval(sceneInterval);

  [].forEach.call(document.querySelectorAll('.ident:not(.hidden)'), function(activeEl) {
    var id = activeEl.getAttribute('id');
    store[id].el.classList.add('hidden');
    store[id].el.classList.add('paused');

    if (store[id].sound) {
      store[id].sound.pause();
    }
  });

  state.el.classList.remove('hidden');
  state.el.classList.remove('paused');

  if (playAudio && state.sound) {
    try {
      window.sound = state.sound;
      state.sound.play();
    } catch (e) {
      console.log('No sound found. Hey, that rhymes.');
    }
  }

  if (isPlaying && !isSticky && !isStaticRoute(curRouteName)) {
    sceneInterval = setInterval(state.onend || advance, state.duration || sceneDuration);
  }

  if (state.onstart) {
    state.onstart();
  }
}

function transitionTo(routeName) {
  var route = routeName;

  if (routeName === 'intro') {
    route = introRoute;
  } else {
    if (routeName === 'random') {
      curRouteIndex = Math.floor(Math.random() * playableRoutes.length);
      route = playableRoutes[curRouteIndex];
    } else {
      curRouteIndex = playableRoutes.indexOf(route);

      if (curRouteIndex > -1) {
        document.title = '▶︎ ' + document.title.split(' ')[1];
        route = playableRoutes[curRouteIndex];
      } else {
        route = notFoundRoute;
      }
    }
  }

  // FIXME: Turned off during Netlify migration because of cross origin
  //   window.history.pushState({}, '', baseHref + route + window.location.search);
  curRouteName = route;
  render(store[route]);
}

function populateStore() {
  playableRoutes.forEach(function(key) {
    var curStore = routes[key]();
    curStore.el = document.getElementById(key);

    var audioEl = curStore.el.querySelector('.ident__audio');

    if (audioEl) {
      curStore.sound = createSound(curStore.el.querySelector('.ident__audio'),
        curStore.soundOpts || {});
    } else {
      curStore.sound = null;
    }

    store[key] = curStore;
  });

  store.fourohfour = routes.fourohfour();
  store.fourohfour.el = document.getElementById('fourohfour');

  store.intro = routes.intro();
  store.intro.el = document.getElementById('intro');
  store.intro.sound = createSound(
    store.intro.el.querySelector('.ident__audio'),
    store.intro.soundOpts);
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
  var route = window.location.pathname.split(namespace)[1];

  if (route) {
    return route.replace('/', '');
  } else {
    return 'intro';
  }
}

function handlePopState(e) {
  transitionTo(getRouteName());
}

function init() {
  var body = document.getElementsByTagName('body')[0],
    params = paramsStrToObj(window.location.search);

  if (params.mute !== undefined) {
    playAudio = false;
  }

  isSticky = (params.sticky === 'true');

  populateStore();

  body.addEventListener('keyup', bodyOnKeyup, false);
  body.addEventListener('click', makeItStop, false);
  window.onpopstate = handlePopState;

  document.getElementById('play-btn').addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    transitionTo('armed');
    document.title = '▶︎ ' + document.title.split(' ')[1];
    return false;
  }, false);

  document.getElementById('btn-mute').addEventListener('click', mute, false);
  transitionTo(getRouteName());

  console.info('don\'t be lookin\' in here ya turkey!');
}

window.addEventListener('load', init, false);
