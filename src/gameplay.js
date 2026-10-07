/** One simulation for live play, stepped judging, and the scripted routes. */
export function createGameplay(app) {
  const { world, characters } = app;
  const state = {};
  const taskIds = ["water", "pacifier", "toy", "door"];
  const radius = 0.30;
  const blockers = world.collisionFootprints.filter(item => item.blocking);
  const hazards = world.collisionFootprints.filter(item => !item.blocking);
  const sink = blockers.find(item => item.id === "sink");
  const taskDetails = {
    water: { label: "Get water", action: "Fill the emergency water", x: world.sink.position.x, z: sink.maxZ + radius + 0.15, duration: 1.8, reach: 0.82 },
    pacifier: { label: "Find pacifier", action: "Retrieve the tiny peace treaty", x: world.pacifier.position.x, z: world.pacifier.position.z, duration: 1.2, reach: 0.85 },
    toy: { label: "Silence toy", action: "Defuse the bedtime DJ", x: world.toys.position.x, z: world.toys.position.z, duration: 1.5, reach: 0.95 },
    door: { label: "Answer door", action: "Tell delivery: please whisper", x: world.door.position.x, z: world.door.position.z + 0.85, duration: 2, reach: 0.88 },
  };
  // Horizontal projection of the authored overview: right and up on the screen.
  const cameraLength = Math.hypot(11.6, 16.8);
  const right = { x: 16.8 / cameraLength, z: -11.6 / cameraLength };
  const up = { x: -11.6 / cameraLength, z: -16.8 / cameraLength };
  let hud, replayHeld = false, stompHeld = false, interactionTask = null;
  let footstepClock = 0, toyClock = 0, doorClock = 0, messageClock = 0;
  let hazardCooldowns = {}, fallbackIds = new Set();
  let progressGrace = {}, footfallTrail = [], modeClock = 0;

  function emit(type, text, extra = {}) {
    const event = { type, text, ...extra };
    state.eventId++;
    state.lastEvent = event;
    state.events.push({ id: state.eventId, time: state.elapsed, ...event });
    if (state.events.length > 64) state.events.shift();
    if (text && type !== "footstep") { state.message = text; messageClock = 3; }
  }
  function reset() {
    Object.assign(state, {
      phase: "playing", noise: 8, tasks: [...taskIds], completedTasks: [], tasksCompleted: 0,
      taskDetails, nearestTask: null, interactionProgress: 0, moving: false, sneaking: false,
      babyMood: "sleeping", eventId: 0, lastEvent: null, events: [], elapsed: 0,
      activeTime: 0, toyUrgency: 0, message: "Four chores. One sleeping tiny dictator.",
      distanceTravelled: 0, demoProbe: null,
      taskProgress: Object.fromEntries(taskIds.map(id => [id, 0])),
      interactionAssist: false, interactionGrace: 0, movementMode: "idle",
      lastMovementMode: "idle", noiseRate: 0, footstepNoise: 0,
      tiptoeTime: 0, rushingTime: 0,
      nightStarted: false, nightTime: 0, movementIntent: false, blockedMovement: false,
      blockedTime: 0, resting: true, toyTimer: 0, doorTimer: 0,
      toyAlarmIn: 9, doorKnockIn: 17, sourceNoiseRate: 0, noiseFloor: 0,
    });
    interactionTask = null;
    footstepClock = toyClock = doorClock = 0;
    messageClock = 5;
    hazardCooldowns = {};
    progressGrace = {};
    footfallTrail = [];
    modeClock = 0;
    replayHeld = stompHeld = false;
    refreshNearest();
    paintHud();
  }
  function passable(x, z) {
    const bounds = world.bounds;
    if (x < bounds.minX + radius || x > bounds.maxX - radius || z < bounds.minZ + radius || z > bounds.maxZ - radius) return false;
    return !blockers.some(b => x > b.minX - radius && x < b.maxX + radius && z > b.minZ - radius && z < b.maxZ + radius);
  }
  function move(dx, dz) {
    const position = characters.parent.position;
    const x = position.x, z = position.z;
    // Small steps prevent tunnelling; separate axes slide around furniture corners.
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.08));
    for (let i = 0; i < steps; i++) {
      if (passable(position.x + dx / steps, position.z)) position.x += dx / steps;
      if (passable(position.x, position.z + dz / steps)) position.z += dz / steps;
    }
    const distance = Math.hypot(position.x - x, position.z - z);
    if (distance > 0.0001) characters.parent.rotation.y = Math.atan2(position.x - x, position.z - z);
    state.distanceTravelled += distance;
    return distance;
  }
  function refreshNearest() {
    const position = characters.parent.position;
    // Keep a partly completed chore selected through small position/key slips.
    if (interactionTask && !state.completedTasks.includes(interactionTask)) {
      const task = taskDetails[interactionTask];
      if (Math.hypot(position.x - task.x, position.z - task.z) <= task.reach + 0.2) {
        state.nearestTask = interactionTask;
        return;
      }
    }
    let nearest = null, distance = Infinity;
    for (const id of taskIds) {
      if (state.completedTasks.includes(id)) continue;
      const task = taskDetails[id];
      const d = Math.hypot(position.x - task.x, position.z - task.z);
      if (d <= task.reach && d < distance) { nearest = id; distance = d; }
    }
    state.nearestTask = nearest;
  }
  function changeNoise(amount) { state.noise = Math.max(0, Math.min(100, state.noise + amount)); }
  function complete(id) {
    state.completedTasks.push(id);
    state.taskProgress[id] = 1;
    progressGrace[id] = 0;
    state.tasksCompleted = state.completedTasks.length;
    state.interactionProgress = 0;
    interactionTask = null;
    const texts = {
      water: "Hydrated. Emotionally? Absolutely not.",
      pacifier: "Tiny peace treaty secured.",
      toy: "Bedtime DJ has been unplugged.",
      door: "Delivery received. WHY DID THEY KNOCK?!",
    };
    changeNoise(id === "door" ? 6 : id === "toy" ? -12 : -4);
    emit("task-complete", texts[id], { task: id, noise: state.noise });
    refreshNearest();
  }
  function update(dt, ctx) {
    const keys = ctx.keys;
    const held = (...names) => names.some(name => keys.has(name));
    const replay = held("KeyR", "r", "R");
    if (replay && !replayHeld) {
      app.restartNight?.();
      replayHeld = true;
      emit("replay", "Another night. Another chance.");
      paintHud();
      return;
    }
    replayHeld = replay;
    if (state.phase !== "playing") {
      state.moving = false;
      state.sneaking = held("ShiftLeft", "ShiftRight", "Shift", "shift") || held("KeyE", "e", "E");
      state.movementIntent = (Number(held("KeyD", "d", "D", "ArrowRight")) - Number(held("KeyA", "a", "A", "ArrowLeft"))) !== 0 ||
        (Number(held("KeyW", "w", "W", "ArrowUp")) - Number(held("KeyS", "s", "S", "ArrowDown"))) !== 0;
      state.blockedMovement = false;
      state.resting = !state.movementIntent && !held("KeyE", "e", "E");
      state.noiseRate = state.footstepNoise = state.sourceNoiseRate = 0;
      modeClock = 0;
      paintHud(); return;
    }
    state.elapsed += dt;
    messageClock = Math.max(0, messageClock - dt);
    for (const id of Object.keys(hazardCooldowns)) hazardCooldowns[id] = Math.max(0, hazardCooldowns[id] - dt);
    footfallTrail = footfallTrail.filter(footfall => (footfall.life -= dt) > 0);
    modeClock = Math.max(0, modeClock - dt);
    const eHeld = held("KeyE", "e", "E");
    refreshNearest();
    // E is a steady-hands clutch: approach quietly, brake inside reach, then work.
    state.interactionAssist = !!(eHeld && state.nearestTask);
    state.sneaking = held("ShiftLeft", "ShiftRight", "Shift", "shift") || eHeld;
    const horizontal = Number(held("KeyD", "d", "D", "ArrowRight")) - Number(held("KeyA", "a", "A", "ArrowLeft"));
    const vertical = Number(held("KeyW", "w", "W", "ArrowUp")) - Number(held("KeyS", "s", "S", "ArrowDown"));
    const length = Math.hypot(horizontal, vertical);
    state.movementIntent = length > 0;
    if (state.movementIntent || eHeld || held("Space", " ", "space")) state.nightStarted = true;
    if (state.nightStarted) state.nightTime += dt;
    const speed = state.sneaking ? 1.35 : 2.6;
    const distance = length && !state.interactionAssist ? move((right.x * horizontal + up.x * vertical) / length * speed * dt,
      (right.z * horizontal + up.z * vertical) / length * speed * dt) : 0;
    state.moving = distance > 0.0001;
    state.blockedMovement = state.movementIntent && !state.moving && !state.interactionAssist;
    if (state.blockedMovement) state.blockedTime += dt;
    refreshNearest();
    const interacting = eHeld && state.nearestTask && !state.moving;
    for (const id of taskIds) {
      if (state.completedTasks.includes(id) || id === (interacting ? state.nearestTask : null)) continue;
      if (progressGrace[id] > 0) progressGrace[id] = Math.max(0, progressGrace[id] - dt);
      else state.taskProgress[id] = Math.max(0, state.taskProgress[id] - dt * 0.25);
    }
    if (interacting) {
      if (interactionTask !== state.nearestTask) {
        interactionTask = state.nearestTask;
        state.interactionProgress = state.taskProgress[interactionTask];
        emit("task-start", taskDetails[interactionTask].action, { task: interactionTask });
      }
      state.interactionAssist = true;
      state.interactionProgress = Math.min(1, state.taskProgress[interactionTask] + dt / taskDetails[interactionTask].duration);
      state.taskProgress[interactionTask] = state.interactionProgress;
      progressGrace[interactionTask] = 1.5;
      const task = taskDetails[interactionTask], parent = characters.parent;
      parent.rotation.y = Math.atan2(task.x - parent.position.x, task.z - parent.position.z);
      changeNoise(0.6 * dt);
      if (state.interactionProgress >= 1 - 1e-8) complete(interactionTask);
    } else {
      const selected = state.nearestTask;
      state.interactionProgress = selected ? state.taskProgress[selected] : 0;
      if (!selected || state.interactionProgress === 0) interactionTask = null;
    }
    state.interactionGrace = state.nearestTask ? progressGrace[state.nearestTask] ?? 0 : 0;
    const exerting = state.movementIntent && !state.interactionAssist && !interacting;
    state.resting = !state.movementIntent && !eHeld && !interacting;
    state.movementMode = interacting ? "chore" : exerting ? state.sneaking ? "tiptoe" : "rush" : "idle";
    state.noiseRate = exerting ? state.sneaking ? 0.38 : 4.5 : interacting ? 0.6 : 0;
    if (exerting) changeNoise((state.sneaking ? 0.38 : 4.5) * dt);
    state.footstepNoise = state.moving ? state.sneaking ? 0.38 : 4.5 : 0;
    if (exerting) {
      state.lastMovementMode = state.movementMode;
      modeClock = 1.5;
      if (state.sneaking) state.tiptoeTime += dt;
      else state.rushingTime += dt;
    }
    if (state.moving) {
      footstepClock += dt;
      if (footstepClock >= (state.sneaking ? 0.8 : 0.48)) {
        footstepClock = 0;
        emit("footstep", "", { noise: state.noise, sneaking: state.sneaking });
        const p = characters.parent.position;
        footfallTrail.push({ x: p.x, z: p.z, quiet: state.sneaking, life: 1.4 });
        if (footfallTrail.length > 5) footfallTrail.shift();
      }
      const p = characters.parent.position;
      for (const hazard of hazards) {
        if (hazard.id === "toys" && state.completedTasks.includes("toy")) continue;
        if (p.x > hazard.minX - radius && p.x < hazard.maxX + radius && p.z > hazard.minZ - radius && p.z < hazard.maxZ + radius && !hazardCooldowns[hazard.id]) {
          const amount = state.sneaking ? 3 : 14;
          changeNoise(amount);
          hazardCooldowns[hazard.id] = 3;
          emit("squeak", hazard.id === "duck" ? "QUACK. A rubber witness has betrayed you." : "SQUEAK. The floor has chosen violence.", { hazard: hazard.id, noise: state.noise, amount });
        }
      }
    }
    // Reading is safe before the first action. Afterwards unattended sources keep ticking,
    // including at a boundary: requested movement is effort, never restful stillness.
    const toyPending = !state.completedTasks.includes("toy");
    const doorPending = !state.completedTasks.includes("door");
    state.noiseFloor = state.nightStarted && doorPending ? 6 : 0;
    if (state.resting) {
      const settleRate = state.nightStarted && toyPending ? 0.15 : 2.2;
      const reduction = Math.min(settleRate * dt, Math.max(0, state.noise - state.noiseFloor));
      changeNoise(-reduction);
      state.noiseRate -= reduction / dt;
    }
    if (exerting || interacting) state.activeTime += dt;
    state.sourceNoiseRate = 0;
    if (state.nightStarted) {
      if (toyPending) {
        toyClock += dt;
        state.toyUrgency = Math.min(1, state.nightTime / 45);
        const sourceRate = 0.6 + state.toyUrgency * 0.8;
        state.sourceNoiseRate += sourceRate;
        changeNoise(sourceRate * dt);
        if (toyClock >= 9 - state.toyUrgency * 3) {
          toyClock = 0;
          changeNoise(4 + state.toyUrgency * 3);
          emit("toy-alarm", "The toy starts its 2 AM world tour.", { task: "toy", noise: state.noise });
        }
      } else { state.toyUrgency = 0; toyClock = 0; }
      if (doorPending) {
        doorClock += dt;
        state.sourceNoiseRate += 0.12;
        changeNoise(0.12 * dt);
        if (doorClock >= 17) {
          doorClock = 0; changeNoise(4);
          emit("door-knock", "Knock knock. Your sleep deprivation has arrived.", { task: "door", noise: state.noise });
        }
      } else doorClock = 0;
    }
    state.noiseRate += state.sourceNoiseRate;
    state.toyTimer = toyClock;
    state.doorTimer = doorClock;
    state.toyAlarmIn = toyPending ? Math.max(0, 9 - state.toyUrgency * 3 - toyClock) : null;
    state.doorKnockIn = doorPending ? Math.max(0, 17 - doorClock) : null;
    const stomp = held("Space", " ", "space");
    if (stomp && !stompHeld) {
      changeNoise(16);
      emit("stomp", "THUMP. Excellent stealth, agent slippers.", { noise: state.noise });
    }
    stompHeld = stomp;
    const mood = state.noise >= 100 ? "awake" : state.noise >= 45 ? "stirring" : "sleeping";
    if (mood !== state.babyMood) { state.babyMood = mood; emit("mood", mood === "stirring" ? "One eye twitched. This is not a drill." : "", { mood, noise: state.noise }); }
    if (state.noise >= 100) {
      state.phase = "lost"; state.babyMood = "awake"; state.moving = false; state.interactionAssist = false; state.movementMode = "idle";
      state.interactionProgress = 0;
      emit("lost", "You have summoned the tiny manager.", { noise: 100 });
    } else if (state.tasksCompleted === 4) {
      state.phase = "won"; state.moving = false; state.interactionAssist = false; state.movementMode = "idle";
      emit("won", "All chores done. You may now collapse quietly.", { noise: state.noise });
    }
    paintHud();
  }

  function ownsFallback() {
    return !app.extensions.some(extension => extension.handlesHud || extension.kind === "presentation" || extension.name === "presentation" || extension.id === "presentation");
  }
  function paintHud() {
    if (!hud) return;
    if (!ownsFallback()) { for (const id of fallbackIds) hud.remove(id); fallbackIds.clear(); return; }
    const text = (id, value, opts) => { fallbackIds.add(id); hud.text(id, value, opts); };
    const bar = (id, value, opts) => { fallbackIds.add(id); hud.bar(id, value, opts); };
    const color = state.noise > 75 ? "#ff8b83" : state.noise >= 45 ? "#ffc873" : "#a7e2d5";
    text("night-title", "DON’T WAKE THE BABY", { x: 0.035, y: 0.045, size: 26, color: "#ffe6bb" });
    text("night-subtitle", "2:13 AM  ·  a very quiet catastrophe", { x: 0.037, y: 0.1, size: 14, color: "#c6d3e8" });
    text("night-noise", `NOISE  ${Math.round(state.noise)} / 100`, { x: 0.965, y: 0.047, size: 18, align: "right", color });
    bar("night-meter", state.noise / 100, { x: 0.73, y: 0.097, w: 0.235, h: 0.017, color });
    text("night-baby", state.babyMood === "awake" ? "BABY: TINY MANAGER ONLINE" : state.babyMood === "stirring" ? "BABY: suspicious…" : "BABY: sleeping", { x: 0.965, y: 0.126, size: 13, align: "right", color });
    text("night-chores", `NIGHT SHIFT  ${state.tasksCompleted}/4`, { x: 0.035, y: 0.245, size: 16, color: "#ffe6bb" });
    taskIds.forEach((id, i) => {
      const done = state.completedTasks.includes(id);
      text(`night-task-${id}`, `${done ? "✓" : "○"}  ${taskDetails[id].label}`, { x: 0.035, y: 0.30 + i * 0.046, size: 15, color: done ? "#92bcb4" : state.nearestTask === id ? "#ffe6a0" : "#e4e9f3" });
      // Project accessible task positions through the real camera; all labels stay on the one HUD.
      const point = characters.parent.position.clone().set(taskDetails[id].x, 0.28, taskDetails[id].z).project(app.camera);
      text(`night-target-${id}`, done ? "✓" : `${i + 1} ${id.toUpperCase()}`, { x: (point.x + 1) / 2, y: (1 - point.y) / 2 - (done ? 0 : 0.047), size: 12, align: "center", color: done ? "#9ce5d3" : "#ffe6bb" });
    });
    const activeMode = state.movementMode === "chore" ? "chore" : (state.moving || state.blockedMovement) ? state.movementMode : modeClock > 0 ? state.lastMovementMode : "idle";
    const quiet = activeMode === "tiptoe";
    const modeColor = quiet || activeMode === "chore" ? "#a7e2d5" : activeMode === "rush" ? "#ffae87" : "#c6d3e8";
    text("night-stance", activeMode === "chore" ? "STEADY HANDS" : quiet ? "TIPTOE · soft slippers" : activeMode === "rush" ? state.blockedMovement ? "PUSHING · room says no" : "RUSHING · THUD THUD" : "SHIFT = QUIET SLIPPERS", { x: 0.035, y: 0.535, size: 14, color: modeColor });
    text("night-stance-rate", activeMode === "chore" ? "Auto-brake · hold E to finish" : quiet ? "+0.38 footstep noise / sec" : activeMode === "rush" ? state.blockedMovement ? "+4.5 effort noise / sec" : "+4.5 footstep noise / sec" : "Footsteps are 12× quieter", { x: 0.035, y: 0.575, size: 12, color: modeColor });
    bar("night-footsteps", activeMode === "rush" ? 1 : quiet ? 0.38 / 4.5 : 0, { x: 0.035, y: 0.614, w: 0.16, h: 0.009, color: modeColor });
    for (let i = 0; i < 5; i++) {
      const footfall = footfallTrail[i];
      const id = `night-footfall-${i}`;
      if (!footfall) { hud.remove(id); continue; }
      const point = characters.parent.position.clone().set(footfall.x, 0.16, footfall.z).project(app.camera);
      text(id, footfall.quiet ? "·" : "◯", { x: (point.x + 1) / 2, y: (1 - point.y) / 2 - (footfall.quiet ? 0.01 : 0.025),
        size: footfall.quiet ? 18 : 34, align: "center", shadow: false,
        color: footfall.quiet ? `rgba(167,226,213,${footfall.life / 1.4})` : `rgba(255,174,135,${footfall.life / 1.4})` });
    }
    const terminal = state.phase !== "playing";
    text("night-result", terminal ? state.phase === "won" ? "NIGHT SURVIVED" : "BABY HAS ENTERED THE CHAT" : "", { x: 0.5, y: 0.20, size: 26, align: "center", color: state.phase === "lost" ? "#ffaea1" : "#b5f2d7" });
    const task = state.nearestTask && taskDetails[state.nearestTask];
    text("night-prompt", terminal ? "Press R for one more very quiet catastrophe" : task ? `HOLD E · ${task.action}${state.interactionProgress > 0 ? ` · ${Math.round(state.interactionProgress * 100)}%` : ""}` : eApproachText(), { x: 0.5, y: 0.827, size: 17, align: "center", color: "#ffe6bb" });
    text("night-assist", !terminal && state.interactionProgress > 0 && !state.interactionAssist && state.interactionGrace > 0 ? "Progress saved · keep holding E" : !terminal && task ? "E stops your slippers. Brief key slips keep your progress." : "", { x: 0.5, y: 0.79, size: 12, align: "center", color: "#a7e2d5" });
    bar("night-progress", state.interactionProgress, { x: 0.34, y: 0.872, w: 0.32, h: 0.012, color: "#b5f2d7" });
    text("night-event", messageClock > 0 || terminal ? state.message : "Silence is a parenting skill.", { x: 0.5, y: 0.902, size: 14, align: "center", color: "#c9d5e8" });
    text("night-controls", "WASD / ARROWS  Move     SHIFT  Tiptoe     HOLD E  Approach + chore     R  Replay", { x: 0.5, y: 0.955, size: 13, align: "center", color: "#e4e9f3" });
  }

  function eApproachText() {
    return state.sneaking ? "TIPTOE · stealth slippers engaged" : "Hold E on approach · your slippers brake at the chore";
  }

  // Demos use the studio's real held-key path and fixed-step update, with no teleports or score writes.
  function drive(keys, frames = 1) {
    const api = app.api;
    const current = api.state().held;
    // Studio applies downs before ups, so overlapping lists would release a held Shift.
    api.injectInput({ up: current.filter(key => !keys.includes(key)),
      down: keys.filter(key => !current.includes(key)) });
    api.step(frames * 1000 / 60);
  }
  function routeTo(goal) {
    // Find a short path on the actual expanded furniture map, then follow it with WASD.
    const spacing = 0.25;
    const startPosition = characters.parent.position;
    const start = { x: startPosition.x, z: startPosition.z };
    const key = (x, z) => `${x},${z}`;
    const queue = [{ ix: 0, iz: 0, previous: null }], visited = new Set(["0,0"]);
    let end = null;
    for (let index = 0; index < queue.length && index < 4000; index++) {
      const node = queue[index];
      const x = start.x + node.ix * spacing, z = start.z + node.iz * spacing;
      if (Math.hypot(x - goal.x, z - goal.z) < 0.3) { end = node; break; }
      for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const ix = node.ix + dx, iz = node.iz + dz, id = key(ix, iz);
        if (visited.has(id) || !passable(start.x + ix * spacing, start.z + iz * spacing)) continue;
        visited.add(id); queue.push({ ix, iz, previous: node });
      }
    }
    if (!end) throw new Error("No reachable route to chore");
    const points = [];
    for (let node = end; node?.previous; node = node.previous) points.push({ x: start.x + node.ix * spacing, z: start.z + node.iz * spacing });
    points.reverse(); points.push(goal);
    for (const point of points) {
      let frames = 0;
      while (Math.hypot(characters.parent.position.x - point.x, characters.parent.position.z - point.z) > 0.12 && frames++ < 240 && state.phase === "playing") {
        const p = characters.parent.position, dx = point.x - p.x, dz = point.z - p.z;
        const h = dx * right.x + dz * right.z, v = dx * up.x + dz * up.z;
        const keys = ["ShiftLeft"];
        if (Math.abs(h) > Math.abs(v) * 0.42) keys.push(h > 0 ? "KeyD" : "KeyA");
        if (Math.abs(v) > Math.abs(h) * 0.42) keys.push(v > 0 ? "KeyW" : "KeyS");
        drive(keys);
      }
      if (frames >= 240) throw new Error("Route stalled against furniture");
    }
    drive([]);
  }
  const demos = {
    "tiptoe-vs-rush"() {
      app.api.seed(17);
      drive(["ShiftLeft", "KeyW"], 72);
      const quiet = { noise: state.noise, distance: state.distanceTravelled, seconds: state.tiptoeTime };
      app.api.seed(17);
      drive(["KeyW"], 72);
      const rush = { noise: state.noise, distance: state.distanceTravelled, seconds: state.rushingTime };
      drive([]);
      const result = { quieter: quiet.noise < rush.noise, quiet, rush };
      state.demoProbe = { name: "tiptoe-vs-rush", ...result };
      return result;
    },
    "steady-hands"() {
      app.api.seed(17);
      // Hold the movement keys throughout approach; E automatically catches the pacifier.
      drive(["KeyW", "KeyD", "KeyE"], 110);
      const position = { x: characters.parent.position.x, z: characters.parent.position.z };
      const began = state.interactionProgress;
      drive(["KeyW", "KeyD", "KeyE"], 12);
      const braked = began > 0 && characters.parent.position.x === position.x && characters.parent.position.z === position.z;
      const beforeSlip = state.interactionProgress;
      drive([], 24);
      const progressRetained = Math.abs(state.interactionProgress - beforeSlip) < 1e-8;
      drive(["KeyW", "KeyD", "KeyE"], 4);
      const result = { braked, progressRetained, resumed: state.interactionProgress > beforeSlip,
        task: state.nearestTask, progress: state.interactionProgress, distanceTravelled: state.distanceTravelled };
      state.demoProbe = { name: "steady-hands", ...result };
      app.api.injectInput({ up: app.api.state().held });
      return result;
    },
    "quiet-win"() {
      app.api.seed(17);
      const route = [];
      for (const id of ["pacifier", "toy", "water", "door"]) {
        routeTo(taskDetails[id]);
        drive(["KeyE"], Math.ceil(taskDetails[id].duration * 60) + 3);
        if (!state.completedTasks.includes(id)) throw new Error(`Chore did not complete: ${id}`);
        route.push({ task: id, x: characters.parent.position.x, z: characters.parent.position.z, noise: state.noise });
      }
      drive([]);
      state.demoProbe = { name: "quiet-win", route, distanceTravelled: state.distanceTravelled };
      return { won: state.phase === "won", route, noise: state.noise,
        state: { phase: state.phase, tasksCompleted: state.tasksCompleted, noise: state.noise } };
    },
    "wake-and-replay"() {
      app.api.seed(17);
      // Match the playtest's 25-second movement hold, including effort at the room edge.
      drive(["KeyD"], 1500);
      const woke = state.phase === "lost" && state.babyMood === "awake";
      const loss = { noise: state.noise, phase: state.phase, distanceTravelled: state.distanceTravelled,
        blockedTime: state.blockedTime, nightTime: state.nightTime,
        stirred: state.events.some(event => event.type === "mood" && event.mood === "stirring") };
      drive(["KeyR"]);
      drive([]);
      const replayed = state.phase === "playing" && state.tasksCompleted === 0 && state.babyMood === "sleeping" && state.noise < 100;
      state.demoProbe = { name: "wake-and-replay", woke, replayed, loss };
      return { woke, replayed };
    },
    "wake-the-baby"() {
      app.api.seed(17);
      drive(["KeyD"], 1500);
      drive([]);
      const result = { woke: state.phase === "lost", blockedTime: state.blockedTime,
        stirred: state.events.some(event => event.type === "mood" && event.mood === "stirring"),
        state: { phase: state.phase, noise: state.noise, babyMood: state.babyMood } };
      state.demoProbe = { name: "wake-the-baby", ...result };
      return result;
    },
  };
  reset();
  return {
    state, reset, update, demos,
    bindHud(api) { hud = api.hud; paintHud(); },
    probes() {
      return { ...state, tasks: [...state.tasks], completedTasks: [...state.completedTasks],
        events: state.events.map(event => ({ ...event })), taskProgress: { ...state.taskProgress }, taskDetails, collisionRadius: radius };
    },
  };
}
