import * as THREE from "three";

// Character-only poses: read gameplay, never write positions, yaw, collision or state.
export function createCharacterReactions(app) {
  const c = app.characters, p = c.parentPose, b = c.babyPose;
  let time = 0, gait = 0, seedPhase = 0, startle = 0, seenEvent = 0;
  let wake = 0, preview = null, lastMood = "sleeping", lastGait = "tiptoe";
  let contract = null;
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

  function paint(state, t, cycle, wakeAmount, jolt = 0) {
    const phase = state.phase;
    const mood = phase === "lost" ? "awake" : (state.babyMood ?? "sleeping");
    const awake = mood === "awake", stirring = mood === "stirring";
    const sneaking = state.sneaking || !state.moving;
    lastMood = mood; lastGait = state.moving ? (sneaking ? "tiptoe" : "walk") : "poised";
    const motion = Math.sin(cycle), breath = Math.sin(t * 1.7 + seedPhase);
    const alarm = Math.min(1, Math.max(0, (state.noise ?? 0) / 100));

    // Exaggerated crouch, alternating tucked knees and pointed slippers. The roots stay still.
    p.upperBody.position.y = sneaking ? -0.15 + Math.abs(motion) * 0.035 : Math.abs(motion) * 0.045;
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
      p.elbows[i].rotation.x = sneaking ? -0.18 + step * 0.06 : 0.55;
      p.eyebrows[i].rotation.z = (i ? -1 : 1) * (0.18 + alarm * 0.28 + jolt * 0.3);
      p.eyebrows[i].position.y = 0.175 + alarm * 0.045 + jolt * 0.055;
      p.eyes[i].scale.y = 0.12 * (1 + alarm * 0.25 + jolt * 0.3);
      p.pupils[i].position.copy(authoredPupils[i]);
      p.pupils[i].position.x += Math.sin(t * 0.8 + seedPhase) * 0.024;
      p.pupils[i].position.y += alarm * 0.01;
    }
    p.face.rotation.set(-0.08 - alarm * 0.05, Math.sin(t * 0.65) * 0.14, -jolt * 0.09);
    p.mouth.scale.set(0.065, 0.047 + alarm * 0.035 + jolt * 0.04, 0.018);
    c.shushText.visible = phase !== "lost" && phase !== "won" && sneaking;
    c.shushText.position.y = 2.57 + Math.sin(t * 1.1) * 0.045;
    p.panicText.visible = phase === "lost";
    p.winText.visible = phase === "won";

    if (phase === "lost") {
      p.upperBody.position.y = -0.06;
      p.upperBody.rotation.z = Math.sin(t * 9) * 0.025;
      p.shoulders[0].rotation.z = -0.55; p.shoulders[1].rotation.z = 0.55;
      p.elbows.forEach(elbow => { elbow.rotation.x = -0.45; });
      p.mouth.scale.set(0.095, 0.11, 0.02);
      p.face.rotation.y = 0;
    } else if (phase === "won") {
      p.upperBody.rotation.set(-0.08, 0, -0.075);
      p.shoulders[0].rotation.z = -0.75; p.shoulders[1].rotation.z = 0.75;
      p.mouth.scale.set(0.1, 0.025, 0.018);
      p.eyes.forEach(eye => { eye.scale.y = 0.07; });
    } else if (jolt > 0.03) {
      p.upperBody.position.y += jolt * 0.13;
      p.shoulders[0].rotation.z -= jolt * 0.48;
      p.shoulders[1].rotation.z += jolt * 0.48;
    } else if ((state.interactionProgress ?? 0) > 0) {
      p.shoulders[0].rotation.x = -0.65;
      p.elbows[0].rotation.x = 0.35;
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
    // Restore only visual descendants; do not reset the gameplay-owned root transform here.
    paint(app.gameplay.state, time, gait, wake);
  }
  function update(dt, ctx) {
    if (preview) {
      const input = ctx.keys.size > 0;
      const cameraChanged = app.camera.position.distanceToSquared(previewPosition) > 0.001 || app.api?.state().camera === "default";
      if (!input && !cameraChanged) return;
      preview = null;
    }
    const state = app.gameplay.state;
    time += dt;
    // The template loads its single HUD asynchronously after bindHud.
    if (time > 0.25 && (!contract || contract.hudObjects === 0)) measureContract();
    if (state.moving) gait += dt * (state.sneaking ? 3.6 : 9);
    else gait += dt * 0.3;
    if (state.eventId !== seenEvent) {
      seenEvent = state.eventId;
      const event = state.lastEvent;
      if (event && (event.noise > 0 || /noise|mistake|squeak|bump|fail|knock/.test(event.type ?? ""))) startle = 1;
    }
    startle = Math.max(0, startle - dt * 1.8);
    const mood = state.phase === "lost" ? "awake" : state.babyMood;
    const target = mood === "awake" ? 1 : mood === "stirring" ? 0.3 : 0;
    wake += (target - wake) * Math.min(1, dt * 5);
    paint(state, time, gait, wake, startle);
  }

  function show(kind, close = false) {
    const mood = kind === "awake" ? "awake" : kind === "stir" ? "stirring" : "sleeping";
    preview = kind;
    const state = { phase: kind === "awake" ? "lost" : kind === "win" ? "won" : "playing",
      babyMood: mood, moving: true, sneaking: kind !== "walk", noise: kind === "awake" ? 100 : kind === "stir" ? 65 : 10 };
    // A fixed, deliberately readable mid-step; previews never mutate gameplay.state.
    paint(state, mood === "stirring" ? 0.45 : 1.15, 1.08, mood === "awake" ? 1 : mood === "stirring" ? 0.3 : 0);
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
    return { characterPreview: kind, actualGameplayTriggersVerified: false };
  }
  function showReset() {
    // First dirty the rig, then restore through the same reset path, with gameplay untouched.
    show("awake"); reset(app.state.seed);
    preview = "reset";
    previewPosition.copy(app.camera.position);
    return { characterPreview: "reset", actualGameplayTriggersVerified: false };
  }
  reset(app.state.seed);
  return {
    update, reset,
    bindHud: measureContract,
    cameras: {
      "characters-sleep": () => show("sleep"),
      "characters-stir": () => show("stir"),
      "characters-awake": () => show("awake"),
      "characters-walk": () => show("walk"),
      "characters-win": () => show("win"),
      "baby-sleep-detail": () => show("sleep", true),
      "baby-stir-detail": () => show("stir", true),
      "baby-awake-detail": () => show("awake", true),
      "parent-tiptoe-detail": () => show("sleep", "parent"),
      "characters-reset": showReset,
    },
    demos: {
      "character-sleep-tiptoe": () => show("sleep"),
      "character-stir": () => show("stir"),
      "character-comic-wakeup": () => show("awake"),
      "character-brisk-walk": () => show("walk"),
      "character-relieved-win": () => show("win"),
      "character-pose-reset": showReset,
    },
    probes() { return { characterMood: lastMood, characterGait: lastGait,
      characterPreview: preview, characterStartle: startle, characterWake: wake,
      characterTime: time, characterGaitPhase: gait, characterParentMeshes: parentMeshes.count,
      characterBabyMeshes: babyMeshes.count,
      characterAllMeshesMapped: parentMeshes.count === parentMeshes.mapped && babyMeshes.count === babyMeshes.mapped,
      characterLabelsAttached: c.shushText.parent === c.parent && c.sleepText.parent === c.baby,
      characterContract: contract }; },
  };
}
