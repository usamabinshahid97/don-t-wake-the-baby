import * as THREE from "three";
import { installStudio } from "./studio.js";
import { createWorld } from "./world.js";
import { createCharacters } from "./characters.js";
import { createGameplay } from "./gameplay.js";

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

function resize() {
  renderer.setSize(Math.max(1, innerWidth), Math.max(1, innerHeight), false);
  camera.aspect = Math.max(1, innerWidth) / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

const world = createWorld(scene);
const characters = createCharacters(scene, world);
export const app = { scene, camera, renderer, world, characters, state: { time: 0, seed: 1 }, extensions: [], api: null };
app.gameplay = createGameplay(app);

// ── FACET WIRING ──
// Each facet adds exactly ONE import and ONE app.extensions.push(createFacet(app)) line here.
import { createCharacterReactions } from "./character-reactions.js";
app.extensions.push(createCharacterReactions(app));
import { createHomeAtmosphere } from "./home-atmosphere.js";
app.extensions.push(createHomeAtmosphere(app));
import { createAudio } from "./audio.js";
app.extensions.push(createAudio(app));
// ── END FACET WIRING ──

const cameras = {
  default() {
    camera.position.set(11.6, 13.8, 16.8);
    camera.lookAt(0, 0.6, 0);
  },
};
const demos = {};
for (const extension of [app.gameplay, ...app.extensions]) {
  Object.assign(cameras, extension.cameras ?? {});
  Object.assign(demos, extension.demos ?? {});
}

// All reset dependencies exist before installStudio, which calls reset synchronously.
function reset(seed) {
  app.state.time = 0;
  app.state.seed = seed;
  world.reset(seed);
  characters.reset(seed);
  app.gameplay.reset(seed);
  for (const extension of app.extensions) extension.reset?.(seed);
  cameras.default();
}

app.restartNight = () => reset(app.state.seed);

app.api = installStudio({
  canvas: renderer.domElement, scene, renderer, camera,
  input: { pointerLock: false },
  player() {
    const position = characters.parent.getWorldPosition(new THREE.Vector3());
    const facing = characters.parent.getWorldQuaternion(new THREE.Quaternion());
    const rotation = new THREE.Euler().setFromQuaternion(facing, "YXZ");
    return { x: position.x, y: position.y, z: position.z, yaw: rotation.y, pitch: rotation.x };
  },
  reset,
  update(dt, ctx) {
    app.state.time += dt;
    app.gameplay.update(dt, ctx);
    characters.update?.(dt, ctx, app.state.time);
    for (const extension of app.extensions) extension.update?.(dt, ctx);
  },
  render() {
    renderer.render(scene, camera);
    renderStats.calls = renderer.info.render.calls;
    renderStats.triangles = renderer.info.render.triangles;
  },
  probes() {
    const probes = { time: app.state.time, ...app.gameplay.probes() };
    for (const extension of app.extensions) Object.assign(probes, extension.probes?.() ?? {});
    return { ...probes, drawCalls: renderStats.calls, triangles: renderStats.triangles };
  },
  cameras, demos,
});

// HUD hooks run only after app.api exists; initial reset must not depend on HUD readiness.
for (const extension of [app.gameplay, ...app.extensions]) extension.bindHud?.(app.api);
