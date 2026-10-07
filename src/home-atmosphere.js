import * as THREE from "three";
import { box, ball, rod, group, mappedMaterial as mat } from "./geometry.js";

// Static, nonblocking dressing. Caller freezes navigation footprints before this step.
export function dressNightHome(scene, w) {
  const { home, sofa, nightstand, toys, toyBlocks, pacifier, ring, kitchen, mug, mugHandle, door, cream, oak, ink } = w;
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
  // A raised loop and butterfly shield, rather than a flat saucer. Preserve both handles.
  pacifier.scale.setScalar(1.8);
  const shield = pacifier.children[0];
  const outline = new THREE.Shape();
  outline.moveTo(0, 0.10);
  outline.bezierCurveTo(-0.12, 0.23, -0.29, 0.19, -0.28, 0.06);
  outline.bezierCurveTo(-0.27, -0.12, -0.11, -0.09, 0, -0.045);
  outline.bezierCurveTo(0.11, -0.09, 0.27, -0.12, 0.28, 0.06);
  outline.bezierCurveTo(0.29, 0.19, 0.12, 0.23, 0, 0.10);
  shield.geometry.dispose();
  shield.geometry = new THREE.ExtrudeGeometry(outline, { depth: 0.045, bevelEnabled: true,
    bevelThickness: 0.018, bevelSize: 0.018, bevelSegments: 3, curveSegments: 12 });
  shield.scale.set(1, 1, 1); shield.position.set(0, 0.08, -0.035);
  shield.material = mat("#ef85a8", 0.58, { grain: 0.15 });
  shield.userData.tag = "pacifier-butterfly-shield";
  ring.geometry.dispose(); ring.geometry = new THREE.TorusGeometry(0.17, 0.035, 10, 36);
  ring.rotation.set(-0.16, 0, 0); ring.position.set(0, 0.19, 0.13);
  ring.material = mat("#d0f3df", 0.5, { grain: 0.1 });
  ring.userData.tag = "pacifier-grab-loop";
  ball(pacifier, 0, 0.08, -0.14, 0.075, 0.075, 0.16, cream);
  for (const x of [-0.20, 0.20]) ball(pacifier, x, 0.13, 0.025, 0.025, 0.032, 0.009, ink);
  ball(pacifier, 0, 0.08, 0.085, 0.078, 0.05, 0.05, ring.material);

  // Four authored chore landmarks; all dressing is added AFTER collision snapshots.
  // A water-drop backsplash tile and jumbo handled mug mark the hydration station.
  const waterTile = group(kitchen, "water-drop-tile", 0.50, 1.83, -1.00);
  box(waterTile, 0.61, 0.64, 0.065, cream, 0, 0, 0, 0.06);
  const waterMaterial = mat("#65c8de", 0.48, { grain: 0.12,
    emissive: "#3995bc", emissiveIntensity: 0.18 });
  const drop = new THREE.Shape();
  drop.moveTo(0, 0.23); drop.bezierCurveTo(-0.02, 0.12, -0.18, -0.04, -0.17, -0.12);
  drop.bezierCurveTo(-0.15, -0.30, 0.15, -0.30, 0.17, -0.12);
  drop.bezierCurveTo(0.18, -0.04, 0.02, 0.12, 0, 0.23);
  const dropMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(drop, { depth: 0.018,
    bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 }), waterMaterial);
  dropMesh.position.z = 0.042; dropMesh.userData.tag = "water-drop-symbol"; waterTile.add(dropMesh);
  ball(waterTile, -0.055, -0.10, 0.08, 0.025, 0.05, 0.009, cream);
  mug.scale.setScalar(1.45); mug.position.y = 1.385;
  mugHandle.scale.setScalar(1.45); mugHandle.position.set(0.84, 1.40, 0.1);
  // Dark liquid and an ivory lip remove the solid-cylinder reading of the cup.
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.13, 24), mat("#315a77", 0.32));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.126; water.userData.tag = "mug-water"; mug.add(water);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.016, 8, 28), cream);
  lip.rotation.x = Math.PI / 2; lip.position.y = 0.126; lip.userData.tag = "mug-rim"; mug.add(lip);

  // A woven doorstep mat and the unmistakable illuminated doorbell identify the last chore.
  const doorstep = group(root, "quiet-doorstep", door.position.x, 0, door.position.z);
  box(doorstep, 1.47, 0.025, 0.81, mat("#bb926e", 0.97, { kind: "cloth", grain: 0.5 }), 0, 0.092, 0.69, 0.035);
  box(doorstep, 1.30, 0.008, 0.65, mat("#536e77", 0.95, { kind: "cloth", grain: 0.4 }), 0, 0.110, 0.69, 0.025);
  // Physical embroidery, baked into a mapped floor mesh; no sprite or HUD marker.
  const stamp = document.createElement("canvas"); stamp.width = 256; stamp.height = 128;
  const stampCtx = stamp.getContext("2d");
  stampCtx.fillStyle = "#e7c9a3"; stampCtx.font = "bold 72px Trebuchet MS, sans-serif";
  stampCtx.textAlign = "center"; stampCtx.textBaseline = "middle"; stampCtx.fillText("SHH", 128, 65);
  const stampMap = new THREE.CanvasTexture(stamp); stampMap.colorSpace = THREE.SRGBColorSpace;
  const embroidery = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.43), mat("#ffffff", 0.95,
    { map: stampMap, transparent: true, depthWrite: false }));
  embroidery.rotation.x = -Math.PI / 2; embroidery.position.set(0, 0.116, 0.69);
  embroidery.userData.tag = "doorstep-embroidery"; doorstep.add(embroidery);
  const doorbell = group(door, "doorbell", 0.76, 1.35, 0.19);
  box(doorbell, 0.24, 0.45, 0.07, oak, 0, 0, 0, 0.06);
  const bellMaterial = mat("#ffc87b", 0.42, { emissive: "#ffb95a", emissiveIntensity: 0.38 });
  ball(doorbell, 0, -0.04, 0.065, 0.075, 0.075, 0.035, bellMaterial);
  // Brass mail slot and relief panel add purpose to the existing door, within its frame.
  box(door, 0.48, 0.095, 0.035, cream, 0, 0.83, 0.18, 0.025);
  box(door, 0.37, 0.025, 0.01, ink, 0, 0.83, 0.203, 0.006);

  // A big glowing power cap tells the player exactly which part of BEEP-O to silence.
  button.scale.multiplyScalar(1.45);
  const power = group(body, "toy-power-symbol", 0.075, 0.276, 0);
  const powerArc = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.007, 6, 24, Math.PI * 1.65), cream);
  powerArc.rotation.set(-Math.PI / 2, 0, Math.PI * 0.675); powerArc.userData.tag = "toy-power-arc";
  power.add(powerArc); rod(power, [0, 0.004, -0.052], [0, 0.004, -0.004], 0.008, cream);

  // Descendants inherit the semantic group, and also carry useful explicit part tags.
  for (const object of [root, home, sofa, nightstand, toys, pacifier, kitchen, door]) object.traverse(o => {
    if (!o.userData.tag) o.userData.tag = `${object.userData.tag}-detail`;
  });
  return { root, button, buttonMaterial, eyeMat, waterMaterial, bellMaterial };
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
