import * as THREE from "three";
import { box, ball, rod, group, mappedMaterial as mat } from "./geometry.js";

// Static, nonblocking dressing. Caller freezes navigation footprints before this step.
export function dressNightHome(scene, w) {
  const { home, sofa, nightstand, toys, toyBlocks, pacifier, cream, oak, ink } = w;
  const root = group(scene, "night-atmosphere");
  const cloth = mat("#a6b2bc", 0.94, { kind: "cloth", grain: 0.5, repeat: 2, bumpScale: 0.008 });
  const piping = mat("#f3c1ab", 0.9, { kind: "cloth", grain: 0.3 });
  const panel = mat("#334962", 0.93, { kind: "wood", grain: 0.3 });
  // A low painted dado makes the cutaway walls feel like a miniature home.
  box(home, 9.3, 0.58, 0.045, panel, 0, 0.56, -3.535, 0.008);
  box(home, 0.045, 0.58, 7.16, panel, -4.535, 0.56, 0, 0.008);
  box(home, 9.3, 0.065, 0.065, oak, 0, 0.88, -3.52, 0.02);
  box(home, 0.065, 0.065, 7.16, oak, -4.52, 0.88, 0, 0.02);
  for (let i = 0; i < 14; i++) box(home, 0.02, 0.48, 0.02, panel, -4.3 + i * 0.66, 0.57, -3.505, 0.004);

  const curtains = group(home, "moonlit-curtains");
  rod(curtains, [1.36, 2.8, -3.18], [3.76, 2.8, -3.18], 0.032, oak);
  for (const x of [1.44, 3.67]) {
    // Pleated cloth hangs clear of the window, keeping its moon and crossbars readable.
    for (let i = 0; i < 4; i++) box(curtains, 0.11, 1.64, 0.08, cloth,
      x + (i - 1.5) * 0.077, 1.94, -3.18 + (i % 2) * 0.035, 0.04);
    box(curtains, 0.35, 0.07, 0.11, oak, x, 1.52, -3.12, 0.025);
  }
  box(home, 2.06, 0.1, 0.29, cream, 2.55, 1.04, -3.32, 0.035);

  // Soft authored light pools are decorative, not collision surfaces or task state.
  // Canvas alpha feathers each pane: there are no hard spotlight triangles or grain.
  function lightMap(color, panes) {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (panes) {
      ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 15;
      for (const x of [24, 137]) for (const y of [24, 137]) ctx.fillRect(x, y, 95, 95);
    } else {
      const fade = ctx.createRadialGradient(128, 128, 8, 128, 128, 124);
      fade.addColorStop(0, color); fade.addColorStop(1, "rgba(255,170,65,0)");
      ctx.fillStyle = fade; ctx.fillRect(0, 0, 256, 256);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
  function pool(tag, width, depth, x, y, z, map, opacity, rotation = 0) {
    const material = mat("#ffffff", 0.95, { map, emissiveMap: map, emissive: "#ffffff",
      emissiveIntensity: 0.65, transparent: true, opacity, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
    mesh.userData.tag = tag; mesh.rotation.set(-Math.PI / 2, 0, rotation);
    mesh.position.set(x, y, z); root.add(mesh); return mesh;
  }
  pool("moonlight-window-panes", 2.6, 3.4, 1.7, 0.158, 0.5,
    lightMap("#8dbeee", true), 0.30, -0.23);
  pool("amber-nightlight-pool", 3.1, 3.1, 3.65, 0.087, 0.35,
    lightMap("rgba(255,175,70,0.8)", false), 0.22);
  const moon = new THREE.SpotLight("#6c9fe7", 15, 8, 0.63, 0.85, 2);
  moon.userData.tag = "light-window"; moon.position.set(2.55, 2.35, -3.14);
  moon.target.position.set(1.2, 0, 0.9); moon.target.userData.tag = "moonlight-target";
  root.add(moon, moon.target);

  // Cushion welt and buttons read as upholstery even in the small primary view.
  for (const z of [-0.49, 0.49]) {
    for (const edge of [-0.58, 0.86]) rod(sofa, [edge, 0.845, z - 0.37], [edge, 0.845, z + 0.37], 0.013, piping);
    for (const edge of [-0.37, 0.37]) rod(sofa, [-0.58, 0.845, z + edge], [0.86, 0.845, z + edge], 0.013, piping);
    for (const x of [-0.18, 0.46]) ball(sofa, x, 0.86, z, 0.034, 0.01, 0.034, piping);
  }
  const pillow = sofa.children.find(o => o.position.x === -0.47);
  if (pillow) pillow.material = mat("#e3d1b0", 0.96, { kind: "cloth", grain: 0.6, repeat: 2 });
  // Small lamp hardware and a single drawer; entirely inside the existing stand.
  box(nightstand, 0.64, 0.28, 0.025, oak, 0, 0.68, 0.432, 0.035);
  ball(nightstand, 0, 0.68, 0.458, 0.045, 0.035, 0.035, cream);
  ball(nightstand, 0, 1.07, 0, 0.18, 0.035, 0.18, oak);
  const shadeEdge = mat("#c69251", 0.9, { kind: "cloth", grain: 0.3 });
  for (const [y, radius] of [[1.377, 0.425], [1.824, 0.258]]) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.012, 8, 40), shadeEdge);
    mesh.rotation.x = Math.PI / 2; mesh.position.set(0, y, 0); nightstand.add(mesh);
  }

  // The old blocks become BEEP-O, a deeply unhelpful nighttime robot alarm.
  // Handles remain the same blocks so chores may still shake/animate them.
  const body = toyBlocks[0]; body.scale.set(1.95, 1.9, 1.4); body.position.y = 0.36;
  body.material = mat("#d88b54", 0.66, { grain: 0.3 });
  const face = group(body, "toy-robot-face");
  box(face, 0.29, 0.16, 0.025, ink, 0, 0.04, 0.188, 0.035);
  const eyeMat = mat("#a9e8d0", 0.4, { emissive: "#49d8af", emissiveIntensity: 0.65 });
  for (const x of [-0.065, 0.065]) ball(face, x, 0.055, 0.205, 0.02, 0.028, 0.008, eyeMat);
  box(face, 0.08, 0.01, 0.01, cream, 0, -0.005, 0.209, 0.003);
  for (const x of [-0.105, -0.05, 0, 0.05, 0.105]) box(face, 0.014, 0.043, 0.013, ink, x, -0.106, 0.191, 0.004);
  rod(body, [-0.095, 0.17, 0], [-0.14, 0.35, 0], 0.012, ink);
  ball(body, -0.14, 0.35, 0, 0.035, 0.035, 0.035, cream);
  const buttonMaterial = mat("#ff9375", 0.42, { emissive: "#ff5135", emissiveIntensity: 1.1 });
  const button = ball(body, 0.075, 0.21, 0, 0.067, 0.045, 0.067, buttonMaterial);
  button.userData.tag = "toy-off-button";
  // The two side blocks retain their exact placements as oversized piano keys.
  for (const block of toyBlocks.slice(1)) {
    box(block, 0.29, 0.055, 0.27, cream, 0, 0.17, 0, 0.025);
    for (const x of [-0.07, 0.04]) box(block, 0.035, 0.014, 0.15, ink, x, 0.203, -0.03, 0.006);
  }
  pacifier.scale.setScalar(1.65);
  // A teat and two shield vents make the floor object recognisable as a pacifier.
  ball(pacifier, 0, 0.015, -0.06, 0.052, 0.07, 0.045, cream);
  for (const x of [-0.10, 0.10]) ball(pacifier, x, 0.035, 0, 0.018, 0.007, 0.018, ink);

  // Descendants inherit the semantic group, and also carry useful explicit part tags.
  for (const object of [root, home, sofa, nightstand, toys, pacifier]) object.traverse(o => {
    if (!o.userData.tag) o.userData.tag = `${object.userData.tag}-detail`;
  });
  return { root, button, buttonMaterial, eyeMat };
}

// Visual-only extension: consumes stable gameplay state and never changes tasks/noise.
export function createHomeAtmosphere(app) {
  let time = 0;
  const { buttonMaterial, eyeMat } = app.world.atmosphere;
  function allMapped(root) {
    let mapped = true;
    root.traverse(o => {
      if (!o.isMesh) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (m.isMeshStandardMaterial && !m.map) mapped = false;
      }
    });
    return mapped;
  }
  function sync() {
    const state = app.gameplay.state;
    const done = state.completedTasks;
    const toyOff = (Array.isArray(done) && done.includes("toy")) ||
      (done instanceof Set && done.has("toy")) ||
      (Array.isArray(state.tasks) && state.tasks.some(t => t?.id === "toy" && t.complete)) ||
      state.tasksCompleted >= 3 || state.toyOff === true;
    buttonMaterial.emissiveIntensity = toyOff ? 0.05 : 0.8 + 0.25 * Math.sin(time * 3);
    eyeMat.emissiveIntensity = toyOff ? 0.02 : 0.65;
  }
  return { reset() { time = 0; sync(); }, update(dt) { time += dt; sync(); },
    probes() { return { homeAtmosphere: "amber-and-moonlight", toyButtonGlow: buttonMaterial.emissiveIntensity,
      homeMappedSurfaces: allMapped(app.world.home), sofaMappedSurfaces: allMapped(app.world.sofa) }; } };
}
