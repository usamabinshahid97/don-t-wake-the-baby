import * as THREE from "three";
import { box, ball, rod, group, label, mappedMaterial as mat, capturePoses } from "./geometry.js";

function reactionLabel(parent, text, x, y, z, color, size, tag) {
  const sprite = label(parent, text, x, y, z, color, size, tag);
  const canvas = sprite.material.map.image, ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineJoin = "round"; ctx.lineWidth = 8; ctx.strokeStyle = "#55434c";
  ctx.strokeText(text, 256, 64); ctx.fillText(text, 256, 64);
  sprite.material.map.needsUpdate = true;
  return sprite;
}

export function createCharacters(scene, world) {
  const { cream, coral, blue, ink, skin, hair, white } = world.materials;
  // All pose changes live below these two roots. Gameplay owns parent position and yaw.
  const parent = group(scene, "pajama-parent", -0.4, 0.1, 1.25);
  parent.rotation.y = 0.36;
  const upperBody = group(parent, "parent-upper-body");
  const torso = box(upperBody, 0.68, 0.83, 0.42, blue, 0, 1.06, 0, 0.15);
  for (let i = 0; i < 5; i++) box(upperBody, 0.62, 0.035, 0.018, cream, 0, 0.76 + i * 0.15, 0.215, 0.004);
  for (const y of [0.84, 1.07, 1.3]) ball(upperBody, 0, y, 0.236, 0.025, 0.025, 0.013, white);
  const legs = [], shins = [], slippers = [], hips = [], knees = [], ankles = [];
  for (const x of [-0.21, 0.21]) {
    const hip = group(parent, "parent-leg-pivot", x, 0.73, 0);
    const thigh = box(hip, 0.23, 0.32, 0.28, blue, 0, -0.16, 0);
    const knee = group(hip, "parent-knee-pivot", 0, -0.32, 0);
    const shin = box(knee, 0.22, 0.3, 0.26, blue, 0, -0.15, 0);
    box(knee, 0.23, 0.04, 0.27, cream, 0, -0.26, 0, 0.01);
    const ankle = group(knee, "parent-slipper-pivot", 0, -0.3, 0);
    const slipper = ball(ankle, 0, -0.02, 0.1, 0.18, 0.095, 0.28, coral);
    ball(ankle, 0, 0.025, 0.25, 0.1, 0.035, 0.08, cream);
    legs.push(thigh); shins.push(shin); slippers.push(slipper); hips.push(hip); knees.push(knee); ankles.push(ankle);
  }
  const face = group(upperBody, "parent-face", 0, 1.7, 0);
  const parentHead = ball(face, 0, 0, 0, 0.415, 0.425, 0.37, skin);
  ball(face, 0, 0.25, -0.07, 0.43, 0.2, 0.34, hair);
  ball(face, -0.34, 0.08, -0.12, 0.11, 0.25, 0.22, hair);
  for (const x of [-0.4, 0.4]) ball(face, x, -0.04, 0, 0.07, 0.11, 0.06, skin);
  const parentEyes = [], pupils = [], eyebrows = [];
  for (const x of [-0.145, 0.145]) {
    parentEyes.push(ball(face, x, 0.01, 0.337, 0.093, 0.12, 0.042, white));
    pupils.push(ball(face, x + 0.018, -0.005, 0.379, 0.039, 0.057, 0.018, ink));
    eyebrows.push(box(face, 0.17, 0.034, 0.025, hair, x, 0.175, 0.34, 0.008));
    ball(face, x * 1.65, -0.12, 0.3, 0.065, 0.035, 0.018, coral);
  }
  ball(face, 0.015, -0.115, 0.383, 0.057, 0.072, 0.036, skin);
  const mouth = ball(face, 0.02, -0.25, 0.335, 0.065, 0.047, 0.018, hair);
  const shoulders = [], elbows = [], arms = [], hands = [];
  for (const side of [-1, 1]) {
    const shoulder = group(upperBody, "parent-arm-pivot", side * 0.34, 1.32, 0);
    arms.push(rod(shoulder, [0, 0, 0], [side * 0.15, -0.27, 0.13], 0.1, blue));
    const elbow = group(shoulder, "parent-elbow-pivot", side * 0.15, -0.27, 0.13);
    arms.push(rod(elbow, [0, 0, 0], [-side * 0.13, 0.27, 0.19], 0.082, blue));
    const hand = ball(elbow, -side * 0.13, 0.31, 0.2, 0.095, 0.14, 0.085, skin);
    // A tiny raised index finger makes the shushing hand legible.
    if (side === 1) ball(elbow, -0.14, 0.43, 0.2, 0.03, 0.12, 0.035, skin);
    shoulders.push(shoulder); elbows.push(elbow); hands.push(hand);
  }
  const shushText = reactionLabel(parent, "SHHH…", 0, 2.65, 0, "#ffe5b3", 0.48, "shush-text");
  const panicText = reactionLabel(parent, "I HAD ONE JOB.", 0, 2.8, 0, "#ffbb9e", 0.49, "parent-reaction");
  const winText = reactionLabel(parent, "STILL ASLEEP!", 0, 2.8, 0, "#cce4c5", 0.49, "parent-reaction");
  panicText.visible = winText.visible = false;

  const baby = group(world.crib, "sleeping-baby");
  const babyBody = ball(baby, 0.29, 1.11, 0.05, 0.58, 0.17, 0.49, mat("#df9d93"));
  const blanketEdge = rod(baby, [-0.05, 1.2, -0.35], [-0.05, 1.2, 0.43], 0.032, cream);
  const headPivot = group(baby, "baby-head-pivot", -0.12, 1.09, 0.04);
  const babyFace = group(headPivot, "baby-face", -0.32, 0.1, 0);
  const babyHead = ball(babyFace, 0, 0, 0, 0.415, 0.255, 0.39, skin);
  for (const z of [-0.36, 0.36]) ball(babyFace, -0.015, 0.055, z, 0.095, 0.085, 0.055, skin);
  ball(babyFace, -0.15, 0.23, -0.1, 0.16, 0.035, 0.13, mat("#f5d2a4"));
  const curl = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 8, 16, Math.PI * 1.6), mat("#bb8654"));
  curl.rotation.x = -Math.PI / 2; curl.position.set(-0.17, 0.265, 0.015); babyFace.add(curl);
  const babyEyes = [], openEyes = [], babyPupils = [], babyBrows = [];
  const sleepyEyes = group(babyFace, "baby-sleepy-eyes");
  const awakeEyes = group(babyFace, "baby-awake-eyes");
  awakeEyes.visible = false;
  for (const z of [-0.145, 0.145]) {
    // Arcs rest on the top-facing cheeks, clearly closed from the game camera.
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.018, 6, 16, Math.PI), hair);
    eye.rotation.x = -Math.PI / 2; eye.rotation.z = Math.PI / 2;
    eye.position.set(-0.055, 0.246, z); sleepyEyes.add(eye); babyEyes.push(eye);
    openEyes.push(ball(awakeEyes, -0.055, 0.249, z, 0.105, 0.025, 0.083, white));
    babyPupils.push(ball(awakeEyes, -0.045, 0.279, z, 0.052, 0.012, 0.049, ink));
    const brow = rod(babyFace, [-0.2, 0.244, z - 0.05], [-0.21, 0.244, z + 0.05], 0.014, hair);
    babyBrows.push(brow);
  }
  const babyMouth = ball(babyFace, 0.19, 0.231, 0, 0.035, 0.025, 0.035, coral);
  const cryMouth = group(babyFace, "baby-cry-mouth", 0.18, 0.22, 0);
  ball(cryMouth, 0, 0, 0, 0.154, 0.034, 0.165, coral);
  ball(cryMouth, 0, 0.034, 0, 0.126, 0.016, 0.137, hair);
  ball(cryMouth, 0.065, 0.052, 0, 0.052, 0.012, 0.087, coral);
  cryMouth.visible = false;
  const babyCheeks = [-0.29, 0.29].map(z => ball(babyFace, 0.09, 0.21, z, 0.072, 0.025, 0.051, coral));
  const babyArms = [];
  for (const z of [-0.37, 0.45]) {
    const arm = group(baby, "baby-arm-pivot", -0.04, 1.12, z);
    rod(arm, [0, 0, 0], [-0.17, 0.06, 0], 0.064, skin);
    ball(arm, -0.2, 0.07, 0, 0.085, 0.08, 0.085, skin);
    babyArms.push(arm);
  }
  const tears = group(babyFace, "baby-comic-tears");
  for (const z of [-0.29, 0.29]) ball(tears, 0.015, 0.26, z, 0.065, 0.025, 0.028, mat("#92c5df"));
  tears.visible = false;
  const cryRays = group(headPivot, "baby-reaction-rays");
  for (const [a, b] of [ [[-0.64,0.37,-0.43],[-0.73,0.51,-0.55]], [[-0.79,0.38,0],[-0.95,0.52,0]], [[-0.64,0.37,0.43],[-0.73,0.51,0.55]] ]) rod(cryRays, a, b, 0.035, cream);
  cryRays.visible = false;
  const sleepText = reactionLabel(baby, "z z Z", -0.25, 2.0, 0, "#ffe8b3", 0.45, "sleep-text");
  const stirText = reactionLabel(baby, "…uh oh", -0.25, 2.13, 0, "#ffd391", 0.5, "baby-reaction");
  const cryText = reactionLabel(baby, "WAAAH!", -0.15, 2.55, 0, "#ffbf9e", 0.72, "baby-reaction");
  stirText.visible = cryText.visible = false;

  // Explicit mesh tags also work with inspectors that filter exact tags, not ancestry.
  parent.traverse(object => { if (object.isMesh) object.userData.tag = "pajama-parent"; });
  baby.traverse(object => { if (object.isMesh) object.userData.tag = "sleeping-baby"; });
  const reset = capturePoses([parent, baby]);
  return {
    parent, baby, sleepText, shushText, reset,
    parentPose: { torso, head: parentHead, upperBody, face, legs, shins, slippers, hips, knees, ankles,
      eyes: parentEyes, pupils, eyebrows, mouth, arms, shoulders, elbows, hands, panicText, winText },
    babyPose: { body: babyBody, head: babyHead, headPivot, face: babyFace, eyes: babyEyes,
      sleepyEyes, awakeEyes, openEyes, pupils: babyPupils, eyebrows: babyBrows,
      mouth: babyMouth, cryMouth, cheeks: babyCheeks, arms: babyArms,
      blanketEdge, tears, cryRays, stirText, cryText },
    // Pose ownership belongs to character-reactions; no competing idle animator.
    update() {},
  };
}
