import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { installStudio } from "./studio.js";

// ── FACET WIRING ──
// (facet imports and initialization go here)
// ── END FACET WIRING ──

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color("#18253f");
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 1000);
const renderStats = { calls: 0, triangles: 0 };
const state = { time: 0 };

function resize() {
  const width = Math.max(1, innerWidth);
  const height = Math.max(1, innerHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

const mat = (color, roughness = 0.82) => new THREE.MeshStandardMaterial({ color, roughness });
const cream = mat("#ffe5b3"), oak = mat("#c98958"), wall = mat("#657b99");
const coral = mat("#e28e81"), blue = mat("#799faa"), ink = mat("#35455c");
const skin = mat("#f6c194"), hair = mat("#553c40"), white = mat("#fff4d9");
function box(parent, w, h, d, material, x, y, z, radius = 0.07) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)), material);
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function ball(parent, x, y, z, sx, sy, sz, material) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), material);
  mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function rod(parent, from, to, radius, material) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 12), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
  mesh.castShadow = true; parent.add(mesh); return mesh;
}
function group(tag, x = 0, y = 0, z = 0) {
  const g = new THREE.Group(); g.userData.tag = tag; g.position.set(x, y, z); scene.add(g); return g;
}
function label(text, x, y, z, color = "#ffe7aa", size = 0.65) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 128;
  const ctx = c.getContext("2d"); ctx.font = "bold 70px Trebuchet MS, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = color; ctx.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthWrite: false }));
  sprite.position.set(x, y, z); sprite.scale.set(size * 4, size, 1); scene.add(sprite); return sprite;
}

// Open dollhouse: two high walls leave the parent and sleeping baby in view.
const home = group("dollhouse");
box(home, 9.6, 0.42, 7.6, ink, 0, -0.26, 0, 0.15);
box(home, 9.35, 0.11, 7.35, oak, 0, -0.015, 0);
for (let i = 0; i < 19; i++) {
  const plank = mat(i % 3 === 0 ? "#bd885f" : i % 3 === 1 ? "#cea073" : "#d6aa7b");
  box(home, 0.477, 0.045, 7.2, plank, -4.32 + i * 0.48, 0.055, 0, 0.01);
  for (let k = 0; k < 4; k++) box(home, 0.01, 0.006, 0.65, oak, -4.47 + i * 0.48 + k * 0.085, 0.08, -2.2 + ((i * 13 + k * 7) % 40) * 0.13, 0.001);
}
box(home, 9.4, 2.8, 0.18, wall, 0, 1.45, -3.65);
box(home, 0.18, 2.8, 7.35, wall, -4.65, 1.45, 0);
box(home, 9.35, 0.17, 0.14, cream, 0, 0.2, -3.51);
box(home, 0.14, 0.17, 7.2, cream, -4.51, 0.2, 0);
box(home, 9.4, 0.13, 0.23, ink, 0, 2.87, -3.65);
box(home, 0.23, 0.13, 7.35, ink, -4.65, 2.87, 0);
// Door and moonlit nursery window.
const door = group("front-door", -0.3, 0, -3.51);
box(door, 1.26, 2.42, 0.14, cream, 0, 1.31, 0);
box(door, 1.08, 2.24, 0.16, mat("#446274"), 0, 1.27, 0.07);
box(door, 0.78, 1.05, 0.04, blue, 0, 1.62, 0.17);
ball(door, 0.36, 1.07, 0.2, 0.07, 0.07, 0.07, mat("#f8c86b", 0.3));
box(home, 1.86, 1.64, 0.13, cream, 2.55, 1.88, -3.48);
box(home, 1.61, 1.38, 0.14, mat("#243551"), 2.55, 1.88, -3.4);
box(home, 0.07, 1.42, 0.04, cream, 2.55, 1.88, -3.3);
box(home, 1.61, 0.07, 0.04, cream, 2.55, 1.88, -3.3);
ball(home, 2.98, 2.28, -3.3, 0.19, 0.19, 0.035, new THREE.MeshStandardMaterial({color:"#ffedbb", emissive:"#f1dca0", emissiveIntensity:0.5}));
for (let i = 0; i < 7; i++) ball(home, 1.9 + (i * 0.33) % 1.2, 1.36 + (i * 0.41) % 1.13, -3.29, 0.018, 0.018, 0.01, white);

const kitchen = group("water-station", -3.3, 0, -2.55);
box(kitchen, 2.15, 0.95, 1.13, blue, 0, 0.58, 0);
box(kitchen, 2.3, 0.15, 1.25, cream, 0, 1.12, 0);
for (const x of [-0.53, 0.53]) { box(kitchen, 0.91, 0.72, 0.03, mat("#91b5bd"), x, 0.6, 0.58); box(kitchen, 0.23, 0.055, 0.08, cream, x, 0.83, 0.62); }
box(kitchen, 0.8, 0.065, 0.65, ink, -0.45, 1.23, 0);
rod(kitchen, [-0.45, 1.23, -0.35], [-0.45, 1.61, -0.35], 0.05, cream);
rod(kitchen, [-0.45, 1.61, -0.35], [-0.45, 1.61, 0], 0.05, cream);
const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.25, 24), coral); mug.position.set(0.58, 1.33, 0.1); kitchen.add(mug);
const mugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.035, 8, 20), coral); mugHandle.position.set(0.76, 1.34, 0.1); kitchen.add(mugHandle);

const rug = group("nursery-rug", 0.65, 0.11, 0.6);
box(rug, 4.45, 0.05, 3.65, mat("#536f85"), 0, 0, 0, 0.02);
box(rug, 4.1, 0.015, 3.3, mat("#678399"), 0, 0.03, 0, 0.004);
for (let i = 0; i < 15; i++) {
  const x = -1.92 + i * 0.27;
  rod(rug, [x, 0, -1.8], [x, 0, -1.98], 0.018, cream);
  rod(rug, [x, 0, 1.8], [x, 0, 1.98], 0.018, cream);
}
const sofa = group("sofa", -3.05, 0, 1.05);
box(sofa, 1.75, 0.56, 2.25, coral, 0, 0.42, 0, 0.18);
box(sofa, 0.3, 1.05, 2.35, coral, -0.77, 0.79, 0, 0.14);
for (const z of [-1.02, 1.02]) box(sofa, 1.75, 0.36, 0.32, coral, 0, 0.91, z, 0.14);
for (const z of [-0.49, 0.49]) box(sofa, 1.3, 0.2, 0.88, mat("#eca797"), 0.14, 0.76, z, 0.09);
const pillow = box(sofa, 0.26, 0.58, 0.57, cream, -0.47, 1.06, 0.54, 0.12); pillow.rotation.x = 0.22;

// Low front crib rail keeps the baby's face readable from the game camera.
const crib = group("baby-crib", 2.7, 0, -1.8);
box(crib, 2.15, 0.19, 1.72, oak, 0, 0.76, 0);
box(crib, 1.99, 0.18, 1.57, white, 0, 0.93, 0, 0.09);
for (const x of [-1.02, 1.02]) for (const z of [-0.79, 0.79]) box(crib, 0.13, 1.34, 0.13, cream, x, 0.77, z);
for (const z of [-0.8, 0.8]) {
  const top = z < 0 ? 1.48 : 1.1;
  box(crib, 2.15, 0.12, 0.13, cream, 0, top, z);
  for (let i = 0; i < 10; i++) rod(crib, [-0.91 + i * 0.2, 0.85, z], [-0.91 + i * 0.2, top, z], 0.025, cream);
}
for (const x of [-1.03, 1.03]) box(crib, 0.1, 0.6, 1.6, cream, x, 1.18, 0);
const baby = new THREE.Group(); baby.userData.tag = "sleeping-baby"; crib.add(baby);
ball(baby, 0.29, 1.1, 0.05, 0.58, 0.16, 0.49, mat("#df9d93"));
ball(baby, -0.46, 1.13, 0.04, 0.36, 0.2, 0.35, skin);
ball(baby, -0.47, 1.28, -0.16, 0.29, 0.05, 0.15, mat("#f5d2a4"));
// Closed eyes are short dark arcs on the upward-facing face.
for (const z of [-0.08, 0.16]) {
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.067, 0.012, 6, 14, Math.PI), hair);
  eye.rotation.x = -Math.PI / 2; eye.rotation.z = Math.PI / 2; eye.position.set(-0.5, 1.317, z); baby.add(eye);
}
ball(baby, -0.27, 1.28, 0.04, 0.035, 0.025, 0.035, coral);
ball(baby, -0.44, 1.29, 0.26, 0.065, 0.012, 0.038, coral);
ball(baby, -0.44, 1.29, -0.2, 0.065, 0.012, 0.038, coral);
const sleepText = label("z z Z", 2.72, 2.3, -1.75, "#ffe8b3", 0.28);

const nightstand = group("nightlight", 4, 0, 0.02);
box(nightstand, 0.85, 0.78, 0.85, oak, 0, 0.49, 0);
box(nightstand, 0.96, 0.12, 0.96, cream, 0, 0.94, 0);
rod(nightstand, [0, 1, 0], [0, 1.52, 0], 0.065, oak);
const lampshade = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.43, 0.45, 32), new THREE.MeshStandardMaterial({ color: "#ffd38a", emissive: "#ffb854", emissiveIntensity: 0.7 }));
lampshade.position.set(0, 1.6, 0); nightstand.add(lampshade);
const lamp = new THREE.PointLight("#ffbc68", 14, 8, 2); lamp.position.set(4, 1.55, 0); scene.add(lamp);

// The parent is caught mid tiptoe, slippers and striped pajamas included.
const parent = group("pajama-parent", -0.4, 0.1, 1.25);
parent.rotation.y = 0.36;
box(parent, 0.68, 0.83, 0.42, blue, 0, 1.06, 0, 0.15);
for (let i = 0; i < 5; i++) box(parent, 0.62, 0.035, 0.015, cream, 0, 0.76 + i * 0.15, 0.212, 0.004);
for (const [x, z, y] of [[-0.21, 0.11, 0.34], [0.22, -0.1, 0.39]]) {
  box(parent, 0.23, 0.65, 0.28, blue, x, y, z);
  ball(parent, x, 0.09, z + 0.13, 0.18, 0.095, 0.28, coral);
}
ball(parent, 0, 1.66, 0, 0.38, 0.4, 0.34, skin);
ball(parent, 0, 1.89, -0.07, 0.39, 0.21, 0.31, hair);
ball(parent, -0.31, 1.72, -0.11, 0.11, 0.25, 0.22, hair);
for (const x of [-0.13, 0.13]) {
  ball(parent, x, 1.68, 0.307, 0.065, 0.088, 0.033, white);
  ball(parent, x + 0.02, 1.67, 0.337, 0.027, 0.039, 0.015, ink);
  box(parent, 0.12, 0.026, 0.023, hair, x, 1.82, 0.305);
}
ball(parent, 0.015, 1.55, 0.338, 0.057, 0.072, 0.036, skin);
ball(parent, 0.02, 1.43, 0.31, 0.045, 0.033, 0.015, hair);
rod(parent, [-0.34, 1.3, 0], [-0.52, 1.08, 0.2], 0.105, blue);
rod(parent, [-0.52, 1.08, 0.2], [-0.61, 1.35, 0.34], 0.085, blue);
ball(parent, -0.61, 1.4, 0.34, 0.11, 0.14, 0.1, skin);
rod(parent, [0.34, 1.29, 0], [0.49, 1.07, 0.2], 0.105, blue);
rod(parent, [0.49, 1.07, 0.2], [0.2, 1.39, 0.41], 0.083, blue);
ball(parent, 0.16, 1.42, 0.42, 0.075, 0.14, 0.075, skin);
label("SHHH…", -0.55, 2.56, 1.25, "#ffe5b3", 0.22);

// Oversized nursery clutter makes the upcoming hazards readable.
const toys = group("noisy-toys", 2.5, 0.13, 1.65);
for (const [x,z,c] of [[0,0,"#e99b71"],[0.43,0.39,"#e1c16d"],[-0.48,0.55,"#8dbabc"]]) {
  const b = box(toys, 0.37, 0.36, 0.37, mat(c), x, 0.18, z); b.rotation.y = x * 2;
}
const duck = group("squeaky-duck", 1.24, 0.22, 2.8);
ball(duck, 0, 0, 0, 0.3, 0.23, 0.35, mat("#f7c75d"));
ball(duck, 0, 0.26, 0.13, 0.2, 0.2, 0.2, mat("#f7c75d"));
ball(duck, 0, 0.2, 0.33, 0.14, 0.055, 0.12, coral);
for (const x of [-0.14, 0.14]) ball(duck, x, 0.3, 0.25, 0.027, 0.027, 0.027, ink);
const pacifier = group("pacifier", 0.7, 0.18, -0.43);
ball(pacifier, 0, 0, 0, 0.15, 0.04, 0.1, coral);
const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 20), cream); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.045, 0); pacifier.add(ring);

new GLTFLoader().load("assets/genex/e8c7e356-7ef7-4cbf-a1d7-adc63b1760dd/a-single-adorable-chunky-stuffed-bunny-t-cmuy4n9e.glb", ({ scene: model }) => {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = 0.95 / Math.max(size.y, 0.001);
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  model.traverse(obj => { if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; } });
  const bunny = group("plush-bunny", 3.45, 0.12, 2.25);
  bunny.rotation.y = -0.2;
  bunny.add(model);
}, undefined, error => console.error("Nursery bunny failed to load", error));

scene.add(new THREE.HemisphereLight("#b6c9ed", "#72564d", 1.8));
const key = new THREE.DirectionalLight("#ffe2b3", 3.2);
key.position.set(-3, 9, 5); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -8; key.shadow.camera.right = 8;
key.shadow.camera.top = 8; key.shadow.camera.bottom = -8; key.shadow.normalBias = 0.035;
scene.add(key);
const rim = new THREE.DirectionalLight("#7daeff", 1.5); rim.position.set(2, 4, -6); scene.add(rim);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat("#18253f"));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.51; ground.receiveShadow = true; scene.add(ground);

const cameras = {
  default() {
    camera.position.set(11.6, 13.8, 16.8);
    camera.lookAt(0, 0.6, 0);
  },
};
cameras.default();

const api = installStudio({
  canvas: renderer.domElement,
  scene,
  renderer,
  camera,
  input: { pointerLock: false },
  reset() { cameras.default(); },
  update(dt) {
    state.time += dt;
    baby.scale.y = 1 + Math.sin(state.time * 1.7) * 0.014;
    parent.rotation.z = Math.sin(state.time * 1.4) * 0.012;
    sleepText.position.y = 2.3 + Math.sin(state.time * 1.1) * 0.06;
  },
  render() {
    renderer.render(scene, camera);
    renderStats.calls = renderer.info.render.calls;
    renderStats.triangles = renderer.info.render.triangles;
  },
  probes() {
    return { phase: "scene", drawCalls: renderStats.calls, triangles: renderStats.triangles };
  },
  cameras,
});
api.hud.text("title", "DON’T WAKE THE BABY", { x: 0.045, y: 0.055, size: 27, color: "#ffe6bb" });
api.hud.text("subtitle", "a very quiet catastrophe", { x: 0.047, y: 0.112, size: 14, color: "#b7c6d9" });
api.hud.text("midnight", "2:13 AM  ·  Everyone is asleep. For now.", { x: 0.045, y: 0.935, size: 15, color: "#f4d7ae" });
