// Presentation consumes the shared state; gameplay remains the only writer.
const CHORES = {
  water: { label: "Get water", verb: "get water", work: "WATER HEIST", finish: "HYDRATED. STILL TIRED.", joke: "The tap has no inside voice." },
  pacifier: { label: "Find pacifier", verb: "find the pacifier", work: "PACIFIER RESCUE", finish: "PEACE PLUG: FOUND.", joke: "Tiny plug. Huge responsibility." },
  toy: { label: "Silence toy", verb: "silence the toy", work: "TOY TAKEDOWN", finish: "CONCERT CANCELLED.", joke: "The encore is strictly forbidden." },
  door: { label: "Answer door", verb: "answer the door", work: "DOOR DUTY", finish: "DELIVERY: SURVIVED.", joke: "Who knocks at 2:13 AM? Honestly." },
};
const ORDER = Object.keys(CHORES);
const INK = { cream: "#ffe8bf", soft: "#b9c8de", mint: "#a9decc", coral: "#ffa08f", amber: "#ffd18a", track: "#40516d" };
const clamp = (value, max = 1) => Math.max(0, Math.min(max, Number(value) || 0));

export function createPresentation(app) {
  let hud = null;
  const drawn = new Map();
  let lastEventId = 0;
  let feedback = null;
  let feedbackTime = 0;
  let lastNoise = 0;
  let lastCompleted = new Set();
  let snapshot = {};
  let viewport = "";

  // The HUD uploads a texture on every API mutation: retain identical items.
  function put(kind, id, value, options) {
    const key = `presentation-${id}`;
    const signature = JSON.stringify([kind, value, options]);
    if (drawn.get(key) === signature) return;
    drawn.set(key, signature);
    hud[kind](key, value, options);
  }
  function text(id, value, options) { put("text", id, value, { shadow: false, ...options }); }
  function bar(id, value, options) { put("bar", id, value, options); }

  function read() {
    const source = app.gameplay?.state ?? {};
    const tasks = Array.isArray(source.tasks) ? source.tasks.filter(id => CHORES[id]) : ORDER;
    const order = [...new Set([...tasks, ...ORDER])];
    const count = Math.floor(clamp(source.tasksCompleted, 4));
    const completed = new Set(Array.isArray(source.completedTasks)
      ? source.completedTasks.filter(id => CHORES[id]) : order.slice(0, count));
    const noise = Math.round(clamp(source.noise, 100));
    return {
      source, order, completed, count: order.filter(id => completed.has(id)).length, noise,
      phase: source.phase ?? "scene", progress: Math.round(clamp(source.interactionProgress) * 100) / 100,
      nearest: CHORES[source.nearestTask] && !completed.has(source.nearestTask) ? source.nearestTask : null,
      mood: source.babyMood ?? "sleeping",
    };
  }

  function render() {
    if (!hud) return;
    const state = read();
    const canvas = app.renderer?.domElement;
    const width = canvas?.clientWidth || 960;
    const height = canvas?.clientHeight || 600;
    const dimensions = `${width}x${height}`;
    if (dimensions !== viewport) {
      viewport = dimensions;
      drawn.clear();
    }
    const narrow = width < 760;
    const tiny = width < 500;
    // HUD font sizes use a 720px baseline with a minimum 1x scale.
    const fontScale = Math.min(1, width / 960, height / 600);
    const font = size => Math.max(10, Math.round(size * fontScale));
    const shortLine = value => {
      const limit = Math.min(78, Math.floor(width * 0.88 / (font(14) * 0.65)));
      const line = String(value).replace(/\s+/g, " ").trim();
      return line.length <= limit ? line : `${line.slice(0, limit - 1).trimEnd()}…`;
    };
    const x = tiny ? 0.025 : 0.045;
    const right = 1 - x;
    const danger = state.noise >= 70;
    const color = danger ? INK.coral : state.noise >= 40 ? INK.amber : INK.mint;
    const ended = state.phase === "won" || state.phase === "lost";
    const nextTask = state.order.find(id => !state.completed.has(id));

    text("title", "DON’T WAKE THE BABY", { x, y: 0.045, size: font(27), weight: 800, color: INK.cream });
    text("subtitle", "2:13 AM  /  a very quiet catastrophe", { x, y: 0.108, size: font(13), color: INK.soft });
    const meterX = tiny ? x : 0.74;
    const meterY = tiny ? 0.18 : 0.05;
    const meterW = tiny ? 0.43 : 0.215;
    text("noise", `NOISE  ${state.noise} / 100`, { x: meterX, y: meterY, size: font(15), weight: 800, color });
    bar("noise-bar", state.noise / 100, { x: meterX, y: meterY + 0.042, w: meterW, h: 0.016, color, back: INK.track });
    text("danger", state.phase === "lost" ? "THE BOSS IS AWAKE." : state.phase === "won" ? "QUIETLY. MIRACULOUSLY. DONE."
      : danger ? "ONE SQUEAK FROM DISASTER" : state.noise >= 40 ? "Careful. Tiny ears." : "Quiet-ish. Keep it that way.", {
      x: tiny ? 0.975 : right, y: meterY + 0.071, align: "right", size: font(12), color,
    });
    const mood = state.mood === "awake" ? "BABY: AWAKE  •  uh-oh."
      : state.mood === "stirring" ? "BABY: STIRRING  •  act natural."
        : "BABY: ASLEEP  •  z z z";
    text("baby", tiny ? mood.replace(/  •.*/, "") : mood, {
      x: right, y: tiny ? 0.184 : 0.192, align: "right", size: font(13), color: state.mood === "sleeping" ? INK.soft : INK.coral,
    });

    text("chores", `MIDNIGHT ERRANDS  ${state.count}/4`, { x, y: tiny ? 0.305 : 0.252, size: font(12), weight: 800, color: INK.amber });
    text("current-task", state.phase === "won" ? "All errands finished." : state.phase === "lost"
      ? `Night shift interrupted · ${state.order.length - state.count} chores left` : state.nearest ? `AT: ${CHORES[state.nearest].label}`
      : nextTask ? `NEXT: ${CHORES[nextTask].label}` : "All errands done.", {
      x, y: tiny ? 0.351 : 0.292, size: font(12), color: INK.soft,
    });
    state.order.forEach((id, index) => {
      const done = state.completed.has(id);
      const near = state.nearest === id;
      const rowY = (tiny ? 0.397 : 0.335) + index * 0.068;
      const justDone = done && feedback?.kind === "complete" && feedback.task === id && !ended;
      text(`task-${id}`, `${done ? "✓" : near ? "›" : "○"}  ${CHORES[id].label}`, {
        x, y: rowY, size: font(17), weight: near || justDone ? 800 : 600,
        color: done ? INK.mint : near ? INK.amber : INK.cream,
      });
      bar(`task-progress-${id}`, justDone ? 1 : near && !ended ? state.progress : 0, {
        x, y: rowY + 0.043, w: tiny ? 0.19 : 0.15, h: 0.005,
        color: justDone ? INK.mint : INK.amber,
        back: !ended && near ? INK.track : "transparent",
      });
    });
    bar("chores-bar", state.count / 4, { x, y: tiny ? 0.68 : 0.637, w: tiny ? 0.28 : 0.16, h: 0.008, color: INK.mint, back: INK.track });

    let heading = state.nearest ? CHORES[state.nearest].work : "Find a chore. Hold E. Stay quiet.";
    let line = feedback?.detail || (state.nearest ? CHORES[state.nearest].joke : state.source.sneaking ? "Tiptoe mode. Professional floor ninja."
      : state.source.moving ? "Those slippers are louder than you think."
        : "Four tiny chores. One very light sleeper.");
    const progress = !ended && state.nearest ? state.progress : 0;
    let accent = state.nearest ? INK.amber : INK.cream;
    if (progress > 0) {
      heading = `${CHORES[state.nearest].work}  ·  ${Math.round(progress * 100)}%`;
      accent = INK.amber;
    }
    if (feedback?.headline) {
      heading = feedback.headline;
      accent = feedback.kind === "noise" ? INK.coral : feedback.kind === "complete" ? INK.mint : INK.amber;
    }
    if (state.phase === "won") {
      heading = "PARENT OF THE NIGHT.";
      line = "All chores done. Your prize: more chores tomorrow.";
    } else if (state.phase === "lost") {
      heading = "YOU WOKE THE BOSS.";
      line = "Your 2:13 AM performance review: WAAAA.";
    }
    const hasAction = !ended && Boolean(state.nearest || feedback?.kind === "complete");
    text("action", !ended && state.nearest ? `HOLD E  ·  ${CHORES[state.nearest].verb}${progress > 0 ? `  ·  ${Math.round(progress * 100)}%` : ""}`
      : !ended && feedback?.kind === "complete" ? `✓ ${state.count}/4 ERRANDS DONE` : "", {
      x: 0.5, y: tiny ? 0.856 : 0.871, align: "center", size: font(13), weight: 800, color: INK.cream,
    });
    text("prompt", heading, { x: 0.5, y: tiny ? 0.802 : 0.816, align: "center", size: font(ended || feedback?.headline || state.nearest ? 27 : 19), weight: 800,
      color: state.phase === "lost" ? INK.coral : state.phase === "won" ? INK.mint : accent });
    bar("interaction", progress, { x: 0.35, y: tiny ? 0.902 : 0.907, w: 0.3, h: 0.008,
      color: INK.amber, back: !ended && state.nearest ? INK.track : "transparent" });
    text("caption", shortLine(tiny ? line.replace("Your prize: more chores tomorrow.", "More chores tomorrow.") : line), {
      x: 0.5, y: hasAction ? tiny ? 0.92 : 0.929 : 0.901, align: "center", size: font(14), color: feedback?.kind === "noise" && !ended ? INK.coral : INK.soft,
    });
    text("controls", ended ? "R  ·  One more quiet catastrophe     /     M  mute" : narrow
      ? "WASD / arrows move · Shift tiptoe · Hold E · R replay · M mute"
      : "WASD / ARROWS  move    ·    SHIFT  tiptoe    ·    HOLD E  interact    ·    R  replay    ·    M  mute", {
      x: 0.5, y: tiny ? 0.962 : 0.966, align: "center", size: font(13), color: ended ? INK.cream : INK.soft,
    });
    snapshot = { phase: state.phase, noise: state.noise, completed: [...state.completed], nearestTask: state.nearest,
      interactionProgress: progress, babyMood: state.mood, width, height,
      feedback: feedback ? { ...feedback } : null };
  }

  function announce(event, state, completedTask = null) {
    const type = String(event?.type ?? "").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    const explicitCompletion = /(^|[-_ ])(complete[d]?|completion|success|done)([-_ ]|$)/.test(type);
    const noisy = /noise|squeak|bump|bonk|hazard|collision|trip|creak|clatter|stomp|knock/.test(type) || type === "toy" || type === "toy-alarm";
    const complete = explicitCompletion || (completedTask && !noisy);
    const task = complete && !explicitCompletion ? completedTask : CHORES[event?.task] ? event.task : completedTask;
    const message = String(event?.text ?? "").replace(/\s+/g, " ").trim();
    if (complete) {
      feedback = { kind: "complete", task, headline: CHORES[task]?.finish ?? "ERRAND: SURVIVED.",
        detail: message || (task ? `✓ ${CHORES[task].label} done. ${CHORES[task].joke}` : "One less chore. Still no sleep.") };
      hud?.flash(INK.cream, 0.035);
    } else if (noisy) {
      // lastEvent.noise has no promised delta semantics. Measure the actual state change.
      const delta = Math.max(0, Math.round(Number.isFinite(event?.amount) ? event.amount : clamp(state.source.noise, 100) - lastNoise));
      const headline = type === "stomp" ? "THUMP. STEALTH: 0/10."
        : type === "toy" || type === "toy-alarm" ? "UNINVITED ENCORE."
          : /knock/.test(type) ? "WHO KNOCKS AT 2:13 AM?"
            : /squeak/.test(type) ? event?.hazard === "duck" ? "QUACK. THE DUCK IS A SNITCH." : "SQUEAK. BETRAYAL."
              : /bump|bonk|collision|trip/.test(type) ? "BONK. ACT NATURAL." : "SHHH. THAT WAS LOUD.";
      feedback = { kind: "noise", task, headline,
        detail: `${delta > 0 ? `+${delta} NOISE  ·  ` : ""}${message || "That was the floor. Definitely the floor."}`, noiseDelta: delta };
    } else if (type === "mood" && event?.mood === "stirring") {
      feedback = { kind: "mood", task: null, headline: "WAS THAT AN EYE TWITCH?", detail: message || "One tiny eyebrow. A very big problem." };
    } else if (message && type !== "footstep") {
      feedback = { kind: "event", task, headline: "", detail: message };
    } else return;
    feedbackTime = 4;
  }

  function update(dt, ctx) {
    const state = read();
    feedbackTime = Math.max(0, feedbackTime - Math.max(0, Number(dt) || 0));
    if (feedbackTime === 0) feedback = null;
    const newlyCompleted = [...state.completed].filter(id => !lastCompleted.has(id));
    const completedTask = newlyCompleted.at(-1) ?? null;
    const eventId = state.source.eventId ?? 0;
    if (eventId !== lastEventId) {
      // Gameplay can emit a squeak, then mood, in one step. Consume its bounded history
      // without letting footsteps/empty events erase a still-readable caption.
      const fresh = Array.isArray(state.source.events)
        ? state.source.events.filter(event => event.id > lastEventId && event.id <= eventId) : [];
      if (!fresh.length && state.source.lastEvent) fresh.push(state.source.lastEvent);
      const meaningful = fresh.filter(event => event.type !== "footstep" && (event.text
        || /complete|success|done|noise|squeak|stomp|knock|bump|bonk|hazard|collision|creak|clatter/.test(event.type ?? "")
        || event.type === "toy"));
      const event = meaningful.filter(event => event.type !== "mood").at(-1) ?? meaningful.at(-1);
      if (event || completedTask) announce(event, state, completedTask);
      lastEventId = eventId;
    } else if (completedTask) announce(null, state, completedTask);
    lastNoise = clamp(state.source.noise, 100);
    lastCompleted = new Set(state.completed);
    render();
  }
  function reset(seed) {
    const state = read();
    lastEventId = state.source.eventId ?? 0;
    lastNoise = clamp(state.source.noise, 100);
    lastCompleted = new Set(state.completed);
    feedback = null;
    feedbackTime = 0;
    render();
  }
  function bindHud(api) {
    hud = api.hud;
    drawn.clear();
    for (const id of ["title", "subtitle", "midnight"]) hud.remove(id);
    render();
  }
  // Review demos reuse the real gameplay route and stop at an actual
  // interaction checkpoint. Every studio method and held key is restored afterward.
  function choreCheckpoint(completed) {
    const api = app.api;
    const originalStep = api.step;
    const checkpoint = {};
    let reached = false;
    try {
      api.step = ms => {
        const frames = Math.max(1, Math.round(ms / (1000 / 60)));
        for (let i = 0; i < frames; i++) {
          originalStep.call(api, 1000 / 60);
          const state = app.gameplay.state;
          if (completed ? state.tasksCompleted === 1 : state.interactionProgress >= 0.5) {
            reached = true;
            throw checkpoint;
          }
        }
      };
      app.gameplay.demos["quiet-win"]();
    } catch (error) {
      if (error !== checkpoint) throw error;
    } finally {
      api.step = originalStep;
      api.injectInput({ up: api.state().held });
      api.pause();
    }
    if (!reached) throw new Error("Real chore checkpoint was not reached");
    return { actualGameplay: true, ...snapshot };
  }
  const demos = {
    "presentation-chore-progress": () => choreCheckpoint(false),
    "presentation-chore-complete": () => choreCheckpoint(true),
    "presentation-noisy-mistake"() {
      const api = app.api;
      api.seed(17);
      api.injectInput({ down: ["Space"] });
      api.step(1000 / 60);
      api.injectInput({ up: ["Space"] });
      api.pause();
      return { actualGameplay: true, ...snapshot };
    },
  };
  return { name: "presentation", id: "presentation", bindHud, update, reset,
    handlesHud: true, demos,
    probes: () => ({ presentation: { ...snapshot, hudItems: drawn.size } }) };
}
