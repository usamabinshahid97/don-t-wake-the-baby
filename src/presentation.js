// Presentation consumes the shared state; gameplay remains the only writer.
const CHORES = {
  water: { label: "Get water", verb: "get water", joke: "Hydrated. Still exhausted." },
  pacifier: { label: "Find pacifier", verb: "find the pacifier", joke: "Tiny plug. Huge responsibility." },
  toy: { label: "Silence toy", verb: "silence the toy", joke: "Concert cancelled. No refunds." },
  door: { label: "Answer door", verb: "answer the door", joke: "Delivery: one bad decision." },
};
const ORDER = Object.keys(CHORES);
const INK = { cream: "#ffe8bf", soft: "#b9c8de", mint: "#a9decc", coral: "#ffa08f", amber: "#ffd18a", track: "#40516d" };
const clamp = (value, max = 1) => Math.max(0, Math.min(max, Number(value) || 0));

export function createPresentation(app) {
  let hud = null;
  const drawn = new Map();
  let lastEventId = 0;
  let caption = "";
  let captionTime = 0;
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
      ? source.completedTasks : order.slice(0, count));
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
    const x = tiny ? 0.025 : 0.045;
    const right = 1 - x;
    const danger = state.noise >= 70;
    const color = danger ? INK.coral : state.noise >= 40 ? INK.amber : INK.mint;
    const ended = state.phase === "won" || state.phase === "lost";

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

    text("chores", `MIDNIGHT ERRANDS  ${state.count}/4`, { x, y: tiny ? 0.315 : 0.285, size: font(12), weight: 800, color: INK.amber });
    state.order.forEach((id, index) => {
      const done = state.completed.has(id);
      const near = state.nearest === id;
      text(`task-${id}`, `${done ? "✓" : near ? "›" : "○"}  ${CHORES[id].label}`, {
        x, y: (tiny ? 0.362 : 0.335) + index * 0.068, size: font(17), weight: near ? 800 : 600,
        color: done ? INK.mint : near ? INK.amber : INK.cream,
      });
    });
    bar("chores-bar", state.count / 4, { x, y: tiny ? 0.66 : 0.637, w: tiny ? 0.28 : 0.16, h: 0.005, color: INK.mint, back: INK.track });

    let heading = state.nearest ? `HOLD E  ·  ${CHORES[state.nearest].verb}` : "Find a chore. Hold E. Stay quiet.";
    let line = caption || (state.source.sneaking ? "Tiptoe mode. Professional floor ninja."
      : state.source.moving ? "Those slippers are louder than you think."
        : "Four tiny chores. One very light sleeper.");
    if (state.phase === "won") {
      heading = "PARENT OF THE NIGHT.";
      line = "All chores done. Your prize: more chores tomorrow.";
    } else if (state.phase === "lost") {
      heading = "YOU WOKE THE BOSS.";
      line = "Your 2:13 AM performance review: WAAAA.";
    }
    text("prompt", heading, { x: 0.5, y: 0.818, align: "center", size: font(ended ? 27 : 19), weight: 800,
      color: state.phase === "lost" ? INK.coral : state.phase === "won" ? INK.mint : INK.cream });
    const progress = !ended && state.nearest ? state.progress : 0;
    bar("interaction", progress, { x: 0.38, y: 0.866, w: 0.24, h: 0.008,
      color: INK.amber, back: !ended && state.nearest ? INK.track : "transparent" });
    text("caption", tiny ? line.replace("Your prize: more chores tomorrow.", "More chores tomorrow.") : line, {
      x: 0.5, y: 0.888, align: "center", size: font(13), color: INK.soft,
    });
    text("controls", ended ? "R  ·  One more quiet catastrophe" : narrow
      ? "WASD / ↑↓←→ move   ·   Shift tiptoe   ·   E hold   ·   R replay"
      : "WASD / ARROWS  move     ·     SHIFT  tiptoe     ·     HOLD E  interact     ·     R  replay", {
      x: 0.5, y: 0.954, align: "center", size: font(13), color: ended ? INK.cream : INK.soft,
    });
    snapshot = { phase: state.phase, noise: state.noise, completed: [...state.completed], nearestTask: state.nearest,
      interactionProgress: progress, babyMood: state.mood, width, height };
  }

  function update(dt, ctx) {
    const state = app.gameplay?.state ?? {};
    captionTime = Math.max(0, captionTime - Math.max(0, Number(dt) || 0));
    if (captionTime === 0) caption = "";
    const eventId = state.eventId ?? 0;
    if (eventId !== lastEventId) {
      lastEventId = eventId;
      const event = state.lastEvent;
      if (event) {
        const type = String(event.type ?? "");
        const complete = /complete|success|done/.test(type);
        caption = String(event.text || (complete && CHORES[event.task]?.joke)
          || (/noise|squeak|bump|bonk|hazard/.test(type) ? "That was the floor. Definitely the floor." : "")).replace(/\s+/g, " ").slice(0, 72);
        captionTime = caption ? 3.5 : 0;
        if (complete) hud?.flash(INK.cream, 0.035);
      }
    }
    render();
  }
  function reset(seed) {
    lastEventId = 0;
    caption = "";
    captionTime = 0;
    render();
  }
  function bindHud(api) {
    hud = api.hud;
    drawn.clear();
    for (const id of ["title", "subtitle", "midnight"]) hud.remove(id);
    render();
  }
  return { name: "presentation", id: "presentation", bindHud, update, reset,
    probes: () => ({ presentation: { ...snapshot, hudItems: drawn.size } }) };
}
