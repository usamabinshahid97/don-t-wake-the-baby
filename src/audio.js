// Local generated originals: keep Studio delivery paths intact.
const GENERATED = {
  duck: new URL('../assets/genex/c6714a1f-86fb-4103-a430-279fc12a0d23/one-isolated-short-ridiculous-rubber-duc-cmuy5emf.mp3', import.meta.url).href,
  toy: new URL('../assets/genex/2ab9265f-fb47-42f6-92cf-a34da0191958/one-isolated-tiny-electronic-toy-alarm-f-cmuy5eyp.mp3', import.meta.url).href,
};
const normal = value => String(value ?? '').toLowerCase().replace(/[ _]+/g, '-');
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

/** One input path, no timers/listeners; simulation decides WHEN, Web Audio renders HOW. */
export function createAudio(app) {
  let context, master, noiseBuffer, seed = 1;
  let time = 0, stepTime = 0, lastId = 0, phase = 'scene', completed = 0;
  let unlocked = false, muted = true, unlocking = false, muteHeld = false;
  let playedEvents = 0, generatedPlayed = 0, lastSound = null, error = null;
  let queue = [], serial = 0;
  const buffers = new Map(), active = new Set();
  // Same-origin delivered files only; no remote service calls from the shipped game.
  const bytes = Object.entries(GENERATED).map(async ([name, url]) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return [name, await response.arrayBuffer()];
    } catch (cause) {
      error = `${name} load: ${cause.message}`;
      return [name, null];
    }
  });

  function makeNoise() {
    if (!context) return;
    noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let value = seed >>> 0 || 1;
    for (let i = 0; i < data.length; i++) {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      data[i] = value / 2147483648 - 1;
    }
  }

  async function unlock() {
    if (unlocking || (unlocked && context?.state === 'running')) return;
    // ctx alone may be injected by the harness: that must not grant autoplay permission.
    if (!globalThis.navigator?.userActivation?.hasBeenActive) return;
    const AudioContext = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!AudioContext) { error = 'Web Audio unavailable'; return; }
    unlocking = true;
    try {
      if (!context) {
        context = new AudioContext();
        master = context.createGain();
        master.gain.value = 0;
        master.connect(context.destination);
        makeNoise();
        // Decoding is asset readiness only; it never schedules a simulation event.
        for (const pending of bytes) {
          pending.then(async ([name, data]) => {
            if (!data) return;
            try { buffers.set(name, await context.decodeAudioData(data)); }
            catch (cause) { error = `${name} decode: ${cause.message}`; }
          });
        }
      }
      await context.resume();
      if (context.state === 'running') {
        const first = !unlocked;
        unlocked = true;
        if (first) muted = false;
        master.gain.setValueAtTime(muted ? 0 : 0.48, context.currentTime);
        if (first) enqueue('ready');
      }
    } catch (cause) { error = `Audio unlock: ${cause.message}`; }
    finally { unlocking = false; }
  }

  function stopAll() {
    for (const source of active) {
      try { source.stop(); } catch { /* already ended */ }
    }
    active.clear();
  }

  function sourceOut(source, duration, volume, filterHz, filterType = 'lowpass') {
    const start = context.currentTime;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, start + 0.006);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    if (filterHz) {
      const filter = context.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = filterHz;
      source.connect(filter); filter.connect(envelope);
      source.onended = () => { active.delete(source); source.disconnect(); filter.disconnect(); envelope.disconnect(); };
    } else {
      source.connect(envelope);
      source.onended = () => { active.delete(source); source.disconnect(); envelope.disconnect(); };
    }
    envelope.connect(master);
    active.add(source);
    source.start(start);
    source.stop(start + duration + 0.015);
  }

  function tone(hz, endHz, duration, volume, wave = 'sine') {
    const source = context.createOscillator();
    source.type = wave;
    source.frequency.setValueAtTime(hz, context.currentTime);
    source.frequency.exponentialRampToValueAtTime(Math.max(1, endHz), context.currentTime + duration);
    sourceOut(source, duration, volume);
  }
  function noise(duration, volume, hz, type) {
    const source = context.createBufferSource();
    source.buffer = noiseBuffer;
    sourceOut(source, duration, volume, hz, type);
  }

  function enqueue(name, delay = 0, volume = 1) {
    if (!unlocked || muted || context?.state !== 'running') return;
    queue.push({ name, due: time + delay, volume, serial: serial++ });
  }

  function play({ name, volume }) {
    if (!unlocked || muted || context?.state !== 'running') return;
    // Cap overlap in bursts, including deterministic manually stepped previews.
    if (active.size > 20) {
      const oldest = active.values().next().value;
      try { oldest.stop(); } catch { /* already ended */ }
      active.delete(oldest);
    }
    const sample = buffers.get(name);
    if (sample) {
      const source = context.createBufferSource();
      source.buffer = sample;
      sourceOut(source, Math.min(sample.duration, 1.25), 0.46 * volume);
      generatedPlayed++;
    } else {
      switch (name) {
        case 'footstep': noise(0.085, 0.13 * volume, 450); tone(100, 60, 0.06, 0.09 * volume); break;
        case 'water': noise(0.38, 0.1 * volume, 2100, 'bandpass'); tone(780, 430, 0.18, 0.012 * volume); break;
        case 'knock': noise(0.045, 0.11 * volume, 900); tone(170, 75, 0.11, 0.22 * volume); break;
        case 'duck': tone(850, 240, 0.22, 0.16 * volume, 'sawtooth'); break;
        case 'toy': tone(1400, 1750, 0.15, 0.11 * volume, 'square'); break;
        case 'wake': tone(200, 580, 0.26, 0.16 * volume, 'triangle'); noise(0.14, 0.06, 1900); break;
        case 'complete': tone(660, 880, 0.1, 0.07 * volume); break;
        case 'win-low': tone(523, 523, 0.13, 0.09); break;
        case 'win-mid': tone(659, 659, 0.13, 0.09); break;
        case 'win-high': tone(784, 1046, 0.3, 0.1); break;
        case 'ready': tone(520, 700, 0.055, 0.025); break;
        default: return;
      }
    }
    playedEvents++;
    lastSound = name;
  }

  function outcome(next) {
    queue = [];
    stopAll();
    if (next === 'lost') { enqueue('wake'); enqueue('wake', 0.3, 0.65); }
    if (next === 'won') { enqueue('win-low'); enqueue('win-mid', 0.14); enqueue('win-high', 0.28); }
  }

  function eventSound(event) {
    const type = normal(event?.type), task = normal(event?.task?.id ?? event?.task);
    if (['won', 'win', 'victory', 'lost', 'lose', 'wake', 'baby-woke', 'baby-wake', 'game-over'].includes(type)) {
      outcome(['won', 'win', 'victory'].includes(type) ? 'won' : 'lost');
      return 'outcome';
    }
    if (['task-complete', 'task-completed', 'complete', 'chore-complete'].includes(type)) {
      enqueue('complete'); enqueue('complete', 0.12, 0.7);
      return 'complete';
    }
    if (/duck|squeak/.test(type) || (['hazard', 'noise', 'bump', 'task-fail'].includes(type) && /duck|squeak/i.test(`${task} ${event?.text ?? ''}`))) enqueue('duck');
    else if (/toy.*(alarm|beep|start)|alarm|toy-trigger/.test(type) || (['hazard', 'noise', 'task-start'].includes(type) && task === 'toy')) enqueue('toy');
    else if (/knock|doorbell/.test(type) || (['task-start', 'interact', 'interaction-start'].includes(type) && task === 'door')) {
      enqueue('knock'); enqueue('knock', 0.17); enqueue('knock', 0.36, 0.75);
    } else if (/water|pour|sip/.test(type) || (['task-start', 'interact', 'interaction-start'].includes(type) && task === 'water')) enqueue('water');
    else if (['toy-off', 'toy-stopped', 'pacifier-found'].includes(type)) enqueue('complete');
    return null;
  }

  function reset(nextSeed = 1) {
    seed = Number(nextSeed) >>> 0;
    time = 0; stepTime = 0; lastId = 0; completed = 0; phase = 'scene';
    queue = []; serial = 0; playedEvents = 0; generatedPlayed = 0; lastSound = null; muteHeld = false;
    stopAll(); makeNoise();
    // Browser permission and player mute preference persist across quick replay.
  }

  function update(dt, ctx = {}) {
    const delta = Number.isFinite(dt) ? Math.max(0, dt) : 0;
    time += delta;
    const keys = ctx.keys;
    if (keys?.size && (!unlocked || context?.state !== 'running')) void unlock();
    const m = Boolean(keys?.has?.('KeyM') || keys?.has?.('m'));
    if (m && !muteHeld && unlocked) {
      muted = !muted;
      queue = []; stopAll();
      master.gain.setValueAtTime(muted ? 0 : 0.48, context.currentTime);
    }
    muteHeld = m;
    const state = app.gameplay?.state ?? {};
    const nextPhase = normal(state.phase);
    const nextCompleted = Number(state.tasksCompleted) || 0;
    const id = state.eventId ?? 0;
    let handled;
    if (id !== lastId) { lastId = id; handled = eventSound(state.lastEvent); }
    if (nextPhase !== phase && ['won', 'lost'].includes(nextPhase) && handled !== 'outcome') outcome(nextPhase);
    if (nextCompleted > completed && handled !== 'complete' && handled !== 'outcome' && !['won', 'lost'].includes(nextPhase)) enqueue('complete');
    completed = nextCompleted; phase = nextPhase;
    if (phase === 'playing' && state.moving) {
      stepTime += delta;
      const cadence = state.sneaking ? 0.64 : 0.36;
      while (stepTime >= cadence) {
        stepTime -= cadence;
        enqueue('footstep', 0, state.sneaking ? 0.3 : 0.65 + clamp(Number(state.noise) || 0, 0, 100) / 200);
      }
    } else stepTime = 0;
    queue.sort((a, b) => a.due - b.due || a.serial - b.serial);
    while (queue.length && queue[0].due <= time + 1e-9) play(queue.shift());
  }

  return {
    reset, update,
    // For an owner-provided trusted gesture hook if a browser requires synchronous resume.
    unlock,
    probes() {
      return {
        audioLoaded: buffers.size, audioGenerated: Object.keys(GENERATED).length,
        audioUnlocked: unlocked && context?.state === 'running', audioMuted: muted,
        audioPlayedEvents: playedEvents, audioGeneratedPlayed: generatedPlayed,
        audioLastSound: lastSound, audioPending: queue.length,
        audioLoadError: error, audioContextState: context?.state ?? 'uninitialized',
        audioProceduralFallback: buffers.size < Object.keys(GENERATED).length,
      };
    },
  };
}
