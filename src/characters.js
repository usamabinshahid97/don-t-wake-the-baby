import * as THREE from "three";
import { box, ball, rod, group, label, mappedMaterial as mat, capturePoses } from "./geometry.js";

export function createCharacters(scene, world) {
  const { crib } = world;
  const { cream, coral, blue, ink, skin, hair, white } = world.materials;
  const baby = group(crib, "sleeping-baby");
  const babyBody = ball(baby, 0.29, 1.1, 0.05, 0.58, 0.16, 0.49, mat("#df9d93"));
  const babyHead = ball(baby, -0.46, 1.13, 0.04, 0.36, 0.2, 0.35, skin);
  ball(baby, -0.47, 1.28, -0.16, 0.29, 0.05, 0.15, mat("#f5d2a4"));
  const babyEyes = [];
  // Closed eyes are short dark arcs on the upward-facing face.
  for (const z of [-0.08, 0.16]) {
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.067, 0.012, 6, 14, Math.PI), hair);
    eye.rotation.x = -Math.PI / 2; eye.rotation.z = Math.PI / 2; eye.position.set(-0.5, 1.317, z); baby.add(eye); babyEyes.push(eye);
  }
  const babyMouth = ball(baby, -0.27, 1.28, 0.04, 0.035, 0.025, 0.035, coral);
  const babyCheeks = [
    ball(baby, -0.44, 1.29, 0.26, 0.065, 0.012, 0.038, coral),
    ball(baby, -0.44, 1.29, -0.2, 0.065, 0.012, 0.038, coral),
  ];
  const sleepText = label(scene, "z z Z", 2.72, 2.3, -1.75, "#ffe8b3", 0.28, "sleep-text");

  // The parent is caught mid tiptoe, slippers and striped pajamas included.
  const parent = group(scene, "pajama-parent", -0.4, 0.1, 1.25);
  parent.rotation.y = 0.36;
  const torso = box(parent, 0.68, 0.83, 0.42, blue, 0, 1.06, 0, 0.15);
  for (let i = 0; i < 5; i++) box(parent, 0.62, 0.035, 0.015, cream, 0, 0.76 + i * 0.15, 0.212, 0.004);
  const legs = [], slippers = [];
  for (const [x, z, y] of [[-0.21, 0.11, 0.34], [0.22, -0.1, 0.39]]) {
    legs.push(box(parent, 0.23, 0.65, 0.28, blue, x, y, z));
    slippers.push(ball(parent, x, 0.09, z + 0.13, 0.18, 0.095, 0.28, coral));
  }
  const parentHead = ball(parent, 0, 1.66, 0, 0.38, 0.4, 0.34, skin);
  ball(parent, 0, 1.89, -0.07, 0.39, 0.21, 0.31, hair);
  ball(parent, -0.31, 1.72, -0.11, 0.11, 0.25, 0.22, hair);
  const parentEyes = [], pupils = [], eyebrows = [];
  for (const x of [-0.13, 0.13]) {
    parentEyes.push(ball(parent, x, 1.68, 0.307, 0.065, 0.088, 0.033, white));
    pupils.push(ball(parent, x + 0.02, 1.67, 0.337, 0.027, 0.039, 0.015, ink));
    eyebrows.push(box(parent, 0.12, 0.026, 0.023, hair, x, 1.82, 0.305));
  }
  ball(parent, 0.015, 1.55, 0.338, 0.057, 0.072, 0.036, skin);
  const mouth = ball(parent, 0.02, 1.43, 0.31, 0.045, 0.033, 0.015, hair);
  const leftUpperArm = rod(parent, [-0.34, 1.3, 0], [-0.52, 1.08, 0.2], 0.105, blue);
  const leftForearm = rod(parent, [-0.52, 1.08, 0.2], [-0.61, 1.35, 0.34], 0.085, blue);
  const leftHand = ball(parent, -0.61, 1.4, 0.34, 0.11, 0.14, 0.1, skin);
  const rightUpperArm = rod(parent, [0.34, 1.29, 0], [0.49, 1.07, 0.2], 0.105, blue);
  const rightForearm = rod(parent, [0.49, 1.07, 0.2], [0.2, 1.39, 0.41], 0.083, blue);
  const rightHand = ball(parent, 0.16, 1.42, 0.42, 0.075, 0.14, 0.075, skin);
  const shushText = label(scene, "SHHH…", -0.55, 2.56, 1.25, "#ffe5b3", 0.22, "shush-text");


  const reset = capturePoses([parent, baby, sleepText, shushText]);
  return {
    parent, baby, sleepText, shushText, reset,
    parentPose: { torso, head: parentHead, legs, slippers, eyes: parentEyes, pupils, eyebrows,
      mouth, arms: [leftUpperArm, leftForearm, rightUpperArm, rightForearm],
      hands: [leftHand, rightHand] },
    babyPose: { body: babyBody, head: babyHead, eyes: babyEyes, mouth: babyMouth, cheeks: babyCheeks },
    // Preserve the delivered idle motion; a character facet can replace this method.
    update(dt, ctx, time) {
      baby.scale.y = 1 + Math.sin(time * 1.7) * 0.014;
      parent.rotation.z = Math.sin(time * 1.4) * 0.012;
      sleepText.position.y = 2.3 + Math.sin(time * 1.1) * 0.06;
    },
  };
}
