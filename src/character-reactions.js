import * as THREE from "three";

// Character-only poses: read gameplay, never write positions, yaw, collision or state.
export function createCharacterReactions(app) {
  const c = app.characters, p = c.parentPose, b = c.babyPose;
  let time = 0, gait = 0, seedPhase = 0, startle = 0, seenEvent = 0;
  let wake = 0, preview = null, lastMood = "sleeping", lastGait = "tiptoe";
  let contract = null;
  let mistakeAge = Infinity, mistakeTask = null, successAge = Infinity, successTask = null;
  let lastReaction = "idle", previewScene = false;
  let boundApi = null;
  let seenHistoryEvent = 0;
  const previewPosition = new THREE.Vector3();
  const authoredPupils = p.pupils.map(eye => eye.position.clone());
  const meshes = root => {
    let count = 0, mapped = 0;
    root.traverse(object => { if (object.isMesh) { count++; if (object.material.map) mapped++; } });
    return { count, mapped };
  };
  const parentMeshes = meshes(c.parent), babyMeshes = meshes(c.baby);
  function measureContract(api = app.api) {
    if (!api?.inspect) return;
    const inspect = api.inspect();
    if (inspect.available === false) return;
    contract = { parentMeshes: inspect.meshes("pajama-parent").length,
      babyMeshes: inspect.meshes("sleeping-baby").length,
      visibleDomElements: inspect.domUi().length, hudObjects: inspect.count("hud") };
  }
  function mistakeBeat(age, task) {
    if (age >= 2.1) return null;
    return { kind: age < 0.25 ? "freeze" : age < 0.85 ? "recoil" : "shush",
      strength: Math.min(1, (2.1 - age) / 0.35), task };
  }
  function bindStudio() {
    const api = app.api;
    if (!api || boundApi === api) return;
    boundApi = api;
    // This is pose instrumentation, not a HUD owner. Gameplay uses bindHud presence to
    // decide whether its fallback HUD should exist, so do not export that hook here.
    const debugCamera = api.debugCamera.bind(api);
    api.debugCamera = name => {
      if (preview && !Object.hasOwn(extension.cameras, name)) clearPreview();
      return debugCamera(name);
    };
    const start = api.start?.bind(api);
    if (start) api.start = () => { clearPreview(); return start(); };
  }

  function paint(state, t, cycle, wakeAmount, jolt = 0, beat = null) {
    const phase = state.phase;
    const mood = phase === "lost" ? "awake" : (state.babyMood ?? "sleeping");
    const awake = mood === "awake", stirring = mood === "stirring";
    const sneaking = state.sneaking || !state.moving;
    lastMood = mood; lastGait = state.moving ? (sneaking ? "tiptoe" : "walk") : "poised";
    const motion = Math.sin(cycle), breath = Math.sin(t * 1.7 + seedPhase);
    const alarm = Math.min(1, Math.max(0, (state.noise ?? 0) / 100));
    const task = state.nearestTask ?? (!preview ? successTask : null);
    const interacting = (state.interactionProgress ?? 0) > 0 || (!preview && successAge < 1.2);
    lastReaction = phase === "lost" ? "lost" : phase === "won" ? "won" : beat?.kind ?? (interacting ? `interact-${task ?? "water"}` : "idle");
    Object.values(p.reactionText).forEach(sprite => { sprite.visible = false; });
    p.surpriseRays.visible = false; p.sweat.visible = false; p.sweat.position.y = 0.11;
    p.smile.visible = phase === "won" || (phase !== "lost" && !beat && interacting && task === "pacifier");
    p.mouth.visible = !p.smile.visible;

    // Exaggerated crouch, alternating tucked knees and pointed slippers. The roots stay still.
    p.upperBody.position.set(0, sneaking ? -0.15 + Math.abs(motion) * 0.035 : Math.abs(motion) * 0.045, 0);
    p.upperBody.rotation.set(sneaking ? 0.10 : -0.025, 0, motion * (sneaking ? 0.065 : 0.035));
    for (let i = 0; i < 2; i++) {
      const step = i === 0 ? motion : -motion;
      const lift = Math.max(0, step);
      p.hips[i].position.y = sneaking ? 0.62 : 0.73;
      p.hips[i].rotation.x = sneaking ? 0.32 - lift * 2.4 : step * 0.55;
      p.hips[i].rotation.z = sneaking ? (i ? -1 : 1) * lift * 0.12 : 0;
      p.knees[i].rotation.x = sneaking ? -0.6 + lift * 3 : -lift * 0.55;
      // Keep the lifted slipper nearly level; a downward toe used to hide the high step.
      p.ankles[i].rotation.x = sneaking ? -p.hips[i].rotation.x - p.knees[i].rotation.x + 0.18 : lift * 0.28;
      p.shoulders[i].rotation.set(sneaking ? -0.13 + step * 0.12 : step * 0.4, 0, (i ? -1 : 1) * (0.13 + alarm * 0.14));
      p.elbows[i].rotation.set(sneaking ? -0.18 + step * 0.06 : 0.55, 0, 0);
      p.eyebrows[i].rotation.z = (i ? -1 : 1) * (0.18 + alarm * 0.28 + jolt * 0.3);
      p.eyebrows[i].position.y = 0.175 + alarm * 0.045 + jolt * 0.055;
      p.eyes[i].scale.y = 0.12 * (1 + alarm * 0.25 + jolt * 0.3);
      p.eyes[i].scale.x = 0.093;
      p.pupils[i].position.copy(authoredPupils[i]);
      p.pupils[i].position.x += Math.sin(t * 0.8 + seedPhase) * 0.024;
      p.pupils[i].position.y += alarm * 0.01;
    }
    p.face.rotation.set(-0.08 - alarm * 0.05, Math.sin(t * 0.65) * 0.14, -jolt * 0.09);
    p.mouth.scale.set(0.065, 0.047 + alarm * 0.035 + jolt * 0.04, 0.018);
    c.shushText.visible = phase !== "lost" && phase !== "won" && sneaking && !beat && !interacting;
    c.shushText.position.y = 2.57 + Math.sin(t * 1.1) * 0.045;
    p.panicText.visible = phase === "lost";
    p.winText.visible = phase === "won";

    if (phase === "lost") {
      p.upperBody.position.y = -0.06;
      p.upperBody.rotation.z = Math.sin(t * 9) * 0.025;
      p.shoulders[0].rotation.set(-0.15, 0, -1.05); p.shoulders[1].rotation.set(-0.15, 0, 1.05);
      p.elbows.forEach(elbow => { elbow.rotation.x = -0.45; });
      p.mouth.scale.set(0.095, 0.11, 0.02);
      p.face.rotation.y = 0;
      p.eyes.forEach(eye => { eye.scale.y = 0.165; });
      p.sweat.visible = true;
    } else if (phase === "won") {
      p.upperBody.rotation.set(-0.08, 0, -0.075);
      p.shoulders[0].rotation.set(-0.15, 0, -2.1);
      p.shoulders[1].rotation.set(-0.25, 0, -0.2);
      p.elbows[0].rotation.set(0.2, 0, 2.1); p.elbows[1].rotation.x = -0.35;
      p.face.rotation.z = 0.12;
      p.mouth.scale.set(0.1, 0.025, 0.018);
      p.eyes.forEach(eye => { eye.scale.y = 0.07; });
    } else if (beat) {
      p.reactionText[beat.kind].visible = true;
      p.sweat.visible = true;
      p.sweat.position.y = 0.11 - Math.sin(t * 6) * 0.045;
      p.face.rotation.set(-0.12, 0, beat.kind === "recoil" ? 0.16 : -0.06);
      p.eyes.forEach(eye => { eye.scale.x = 0.115; eye.scale.y = 0.165; });
      p.mouth.scale.set(0.085, 0.09, 0.018);
      if (beat.kind === "freeze") {
        p.upperBody.rotation.set(-0.12, 0, -0.08);
        p.shoulders[0].rotation.set(-0.4, 0, -0.65);
        p.shoulders[1].rotation.set(-0.4, 0, 0.65);
        p.elbows.forEach(elbow => { elbow.rotation.x = 0.5; });
        p.surpriseRays.visible = true;
      } else if (beat.kind === "recoil") {
        p.upperBody.position.set(0, 0.02, -0.08);
        p.upperBody.rotation.set(-0.32, 0, -0.19 * beat.strength);
        p.shoulders[0].rotation.set(-0.4, 0, -1.4);
        p.shoulders[1].rotation.set(-0.4, 0, 1.4);
        p.elbows.forEach(elbow => { elbow.rotation.x = 0.5; });
        p.surpriseRays.visible = true;
      } else {
        p.upperBody.rotation.set(0.22, 0, 0.12);
        // One pleading palm reaches forward; the other hand returns to a shushing finger.
        p.shoulders[0].rotation.set(-0.85, -0.35, -0.25);
        p.elbows[0].rotation.x = 1.15;
        p.shoulders[1].rotation.set(-0.25, 0, -0.25);
        p.elbows[1].rotation.x = -0.35;
        p.mouth.scale.set(0.035, 0.055, 0.018);
      }
    } else if (interacting) {
      const activeTask = p.reactionText[task] ? task : "water";
      p.reactionText[activeTask].visible = true;
      const fidget = Math.sin(t * 5) * 0.05;
      p.upperBody.rotation.set(0.18, -0.12, 0.06);
      // Broad reach reads in silhouette; all offsets are local visual pivots.
      p.shoulders[0].rotation.set(-0.85, -0.45, -0.25);
      p.elbows[0].rotation.x = 1.15 + fidget;
      p.shoulders[1].rotation.set(-0.25, 0, -0.2);
      p.elbows[1].rotation.x = -0.25;
      p.face.rotation.set(0, -0.2, 0.08);
      p.pupils.forEach((eye, i) => { eye.position.x = authoredPupils[i].x - 0.04; });
      if (activeTask === "pacifier") {
        p.upperBody.rotation.z = -0.12;
        p.shoulders[0].rotation.set(-0.5, -0.1, -0.8);
        p.elbows[0].rotation.x = -0.25;
        p.mouth.scale.set(0.1, 0.025, 0.018);
      } else if (activeTask === "toy") {
        p.upperBody.rotation.x = 0.27;
        p.shoulders[1].rotation.set(-0.8, 0.35, 0.25);
        p.elbows[1].rotation.x = 1.15 + fidget;
      } else if (activeTask === "door") {
        p.upperBody.rotation.set(-0.08, 0, -0.1);
        p.face.rotation.set(0, 0.23, -0.16);
        p.shoulders[0].rotation.set(-0.15, 0, -1.35);
        p.elbows[0].rotation.x = -0.3;
      }
    }
    if (beat || interacting || phase === "won" || phase === "lost") {
      // A comic glance at the viewer remains readable after gameplay turns the parent.
      // Twist only the visual torso/head; the player root yaw and collision stay untouched.
      const facing = Math.atan2(app.camera.position.x - c.parent.position.x,
        app.camera.position.z - c.parent.position.z) - c.parent.rotation.y;
      const turn = Math.atan2(Math.sin(facing), Math.cos(facing));
      if (!interacting || beat || phase === "won" || phase === "lost") {
        p.upperBody.rotation.y = Math.max(-1.15, Math.min(1.15, turn));
      }
      p.face.rotation.y = Math.max(-1.3, Math.min(1.3, turn - p.upperBody.rotation.y));
    }

    // Breath expands the blanket, not the whole crib or the label anchor.
    b.body.scale.y = 0.17 * (1 + breath * (awake ? 0.04 : 0.075));
    b.body.position.y = 1.11 + breath * 0.009;
    b.headPivot.rotation.z = -wakeAmount * 0.8;
    b.headPivot.rotation.x = (stirring ? Math.sin(t * 3.2) * 0.13 : awake ? Math.sin(t * 8) * 0.055 : 0);
    b.headPivot.position.y = 1.09 + wakeAmount * 0.08 + (awake ? Math.abs(Math.sin(t * 7)) * 0.055 : breath * 0.009);
    b.face.rotation.x = awake ? 0.2 : 0;
    const peek = stirring && Math.sin(t * 2.5) > 0.65;
    b.sleepyEyes.visible = !awake && !peek;
    b.awakeEyes.visible = awake || peek;
    b.openEyes.forEach(eye => { eye.scale.x = peek ? 0.04 : 0.105; });
    b.pupils.forEach(eye => { eye.scale.x = peek ? 0.025 : 0.052; });
    b.eyebrows.forEach((brow, i) => {
      brow.visible = stirring || awake;
      brow.rotation.y = (i ? 1 : -1) * (stirring ? 0.4 : awake ? -0.55 : 0);
      brow.position.y = stirring ? 0.255 : 0.244;
    });
    b.mouth.visible = !awake;
    b.mouth.scale.set(stirring ? 0.055 : 0.035, 0.025, stirring ? 0.055 : 0.035);
    b.cryMouth.visible = awake;
    b.cryMouth.scale.setScalar(1 + Math.sin(t * 7) * 0.09);
    b.tears.visible = awake; b.cryRays.visible = awake;
    b.cryRays.scale.setScalar(1 + Math.sin(t * 7) * 0.07);
    b.arms.forEach((arm, i) => {
      arm.rotation.z = awake ? -0.7 + Math.sin(t * 9 + i * Math.PI) * 0.4 : stirring ? -0.18 + Math.sin(t * 3 + i) * 0.16 : breath * 0.035;
      arm.rotation.x = awake ? (i ? 1 : -1) * 0.75 : 0;
    });
    c.sleepText.visible = !awake && !stirring;
    c.sleepText.position.y = 2.0 + Math.sin(t * 1.1 + seedPhase) * 0.07;
    b.stirText.visible = stirring; b.cryText.visible = awake;
    b.stirText.position.y = 2.13 + Math.sin(t * 3) * 0.025;
    b.cryText.position.y = 2.55 + Math.sin(t * 7) * 0.04;
  }

  function reset(seed = 1) {
    time = 0; gait = 0.92; wake = 0; startle = 0; seenEvent = 0; preview = null;
    seedPhase = ((seed >>> 0) % 997) / 997 * Math.PI * 2;
    mistakeAge = successAge = Infinity; mistakeTask = successTask = null;
    previewScene = false;
    seenHistoryEvent = 0;
    p.sweat.position.y = 0.11;
    // Restore only visual descendants; do not reset the gameplay-owned root transform here.
    paint(app.gameplay.state, time, gait, wake);
  }
  function clearPreview() {
    if (!preview) return;
    preview = null;
    paint(app.gameplay.state, time, gait, wake, startle, mistakeBeat(mistakeAge, mistakeTask));
  }
  function update(dt, ctx) {
    bindStudio();
    if (preview) {
      const input = ctx.keys.size > 0;
      const cameraChanged = app.camera.position.distanceToSquared(previewPosition) > 0.001 || app.api?.state().camera === "default";
      if (!input && !cameraChanged) return;
      clearPreview();
    }
    const state = app.gameplay.state;
    time += dt;
    // The template loads its single HUD asynchronously after bindHud.
    if (time > 0.25 && (!contract || contract.hudObjects === 0)) measureContract();
    if (mistakeAge >= 2.1) {
      if (state.moving) gait += dt * (state.sneaking ? 3.6 : 9);
      else gait += dt * 0.3;
    }
    if (state.eventId !== seenEvent) {
      seenEvent = state.eventId;
      // Several events can arrive in one frame (stomp then mood, squeak then footstep).
      // `noise` is the total meter in the merged game, not an event's noise increase.
      const fresh = state.events?.filter(event => event.id > seenHistoryEvent) ?? (state.lastEvent ? [state.lastEvent] : []);
      seenHistoryEvent = state.eventId;
      const noisy = fresh.find(event => /^(stomp|squeak|toy|door-knock|mistake|bump|noise)$/.test(event.type ?? ""));
      const event = fresh.find(event => /complete|success|done/.test(event.type ?? ""));
      if (noisy) {
        mistakeAge = 0; mistakeTask = noisy.task ?? noisy.hazard ?? null;
      } else if (event) {
        successAge = 0; successTask = event.task ?? null;
      }
    }
    mistakeAge += dt; successAge += dt;
    const beat = mistakeBeat(mistakeAge, mistakeTask);
    startle = beat?.strength ?? 0;
    const mood = state.phase === "lost" ? "awake" : state.babyMood;
    const target = mood === "awake" ? 1 : mood === "stirring" ? 0.3 : 0;
    wake += (target - wake) * Math.min(1, dt * 5);
    paint(state, time, gait, wake, startle, beat);
  }

  function show(kind, close = false) {
    bindStudio();
    const mood = kind === "awake" ? "awake" : kind === "stir" ? "stirring" : "sleeping";
    preview = kind;
    previewScene = true;
    const state = { phase: kind === "awake" ? "lost" : kind === "win" ? "won" : "playing",
      babyMood: mood, moving: kind === "walk" || kind === "sleep", sneaking: kind !== "walk", noise: kind === "awake" ? 100 : kind === "stir" ? 65 : 10,
      nearestTask: ["water", "pacifier", "toy", "door"].includes(kind) ? kind : null,
      interactionProgress: ["water", "pacifier", "toy", "door"].includes(kind) ? 0.6 : 0 };
    const beat = ["freeze", "recoil", "shush"].includes(kind) ? { kind, strength: 1, task: "duck" } : null;
    // A fixed, deliberately readable mid-step; previews never mutate gameplay.state.
    paint(state, mood === "stirring" ? 0.45 : 1.15, 1.08, mood === "awake" ? 1 : mood === "stirring" ? 0.3 : 0, beat ? 1 : 0, beat);
    if (close === "parent") {
      const at = c.parent.getWorldPosition(new THREE.Vector3());
      app.camera.position.copy(at).add(new THREE.Vector3(3.6, 3.8, 5.8));
      app.camera.lookAt(at.x, at.y + 1.0, at.z);
    } else if (close) {
      const at = c.baby.getWorldPosition(new THREE.Vector3());
      app.camera.position.copy(at).add(new THREE.Vector3(3.9, 5.3, 6.2));
      app.camera.lookAt(at.x - 0.2, at.y + 1.25, at.z);
    } else {
      app.camera.position.set(11.6, 13.8, 16.8); app.camera.lookAt(0, 0.6, 0);
    }
    previewPosition.copy(app.camera.position);
    return { characterPreview: kind, characterOnly: true, actualGameplayTriggersVerified: false };
  }
  function showReset() {
    // First dirty the rig, then restore through the same reset path, with gameplay untouched.
    show("awake"); paint(app.gameplay.state, 0, 0.92, 0);
    preview = "reset";
    previewPosition.copy(app.camera.position);
    return { characterPreview: "reset", actualGameplayTriggersVerified: false };
  }
  function showCleanup() {
    const before = JSON.stringify(app.gameplay.state);
    const rootPosition = c.parent.position.clone(), rootRotation = c.parent.quaternion.clone();
    show("recoil");
    app.api.debugCamera("default");
    return { characterPreview: "returned-to-play", previewCleared: preview === null,
      gameplayUnchanged: before === JSON.stringify(app.gameplay.state),
      rootUnchanged: rootPosition.equals(c.parent.position) && rootRotation.equals(c.parent.quaternion),
      actualGameplayTriggersVerified: false };
  }
  const extension = {
    update, reset,
    cameras: {
      // Put the main-camera reaction ladder first for capture tools with an eight-view limit.
      "parent-interaction": () => show("water"),
      "parent-noise-freeze": () => show("freeze"),
      "parent-noise-recoil": () => show("recoil"),
      "parent-noise-shush": () => show("shush"),
      "characters-win": () => show("win"),
      "characters-awake": () => show("awake"),
      "characters-reset": showReset,
      "characters-sleep": () => show("sleep"),
      "characters-stir": () => show("stir"),
      "characters-walk": () => show("walk"),
      "baby-sleep-detail": () => show("sleep", true),
      "baby-stir-detail": () => show("stir", true),
      "baby-awake-detail": () => show("awake", true),
      "parent-tiptoe-detail": () => show("sleep", "parent"),
      "parent-pacifier": () => show("pacifier"),
      "parent-quiet-toy": () => show("toy"),
      "parent-door-listen": () => show("door"),
      "parent-interaction-detail": () => show("water", "parent"),
      "parent-mistake-detail": () => show("recoil", "parent"),
      "characters-preview-cleanup": showCleanup,
    },
    demos: {
      "character-interaction-reach": () => show("water"),
      "character-noisy-mistake": () => show("recoil"),
      "character-noise-freeze": () => show("freeze"),
      "character-pleading-shush": () => show("shush"),
      "character-relieved-win": () => show("win"),
      "character-comic-wakeup": () => show("awake"),
      "character-pose-reset": showReset,
      "character-preview-return-to-play": showCleanup,
      "character-sleep-tiptoe": () => show("sleep"),
      "character-stir": () => show("stir"),
      "character-brisk-walk": () => show("walk"),
      "character-pacifier-relief": () => show("pacifier"),
      "character-quiet-toy": () => show("toy"),
      "character-door-listen": () => show("door"),
    },
    probes() { return { characterMood: lastMood, characterGait: lastGait,
      characterPreview: preview, characterStartle: startle, characterWake: wake,
      characterTime: time, characterGaitPhase: gait, characterParentMeshes: parentMeshes.count,
      characterBabyMeshes: babyMeshes.count,
      characterAllMeshesMapped: parentMeshes.count === parentMeshes.mapped && babyMeshes.count === babyMeshes.mapped,
      characterLabelsAttached: c.shushText.parent === c.parent && c.sleepText.parent === c.baby,
      characterContract: contract, characterReaction: lastReaction,
      characterPreviewOnly: previewScene && !!preview }; },
  };
  reset(app.state.seed);
  return extension;
}
