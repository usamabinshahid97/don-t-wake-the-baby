import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { box, ball, rod, group, createMaterials, mappedMaterial as mat, capturePoses } from "./geometry.js";
import { dressNightHome } from "./home-atmosphere.js";

// Exact delivered Genex asset path: keep this URL and the visible nursery use intact.
export const BUNNY_ASSET_PATH = "assets/genex/e8c7e356-7ef7-4cbf-a1d7-adc63b1760dd/a-single-adorable-chunky-stuffed-bunny-t-cmuy4n9e.glb";

export function createWorld(scene) {
  const materials = createMaterials();
  const { cream, oak, wall, coral, blue, ink, white } = materials;
  // Open dollhouse: two high walls leave the parent and sleeping baby in view.
  const home = group(scene, "dollhouse");
  box(home, 9.6, 0.42, 7.6, ink, 0, -0.26, 0, 0.15);
  box(home, 9.35, 0.11, 7.35, oak, 0, -0.015, 0);
  for (let i = 0; i < 19; i++) {
    const plank = mat(i % 3 === 0 ? "#b48156" : i % 3 === 1 ? "#c69a6c" : "#cea474", 0.83, { kind: "wood", seed: i + 3, grain: 0.65, bumpScale: 0.008 });
    box(home, 0.477, 0.045, 7.2, plank, -4.32 + i * 0.48, 0.055, 0, 0.01);
  }
  box(home, 9.4, 2.8, 0.18, wall, 0, 1.45, -3.65);
  box(home, 0.18, 2.8, 7.35, wall, -4.65, 1.45, 0);
  box(home, 9.35, 0.17, 0.14, cream, 0, 0.2, -3.51);
  box(home, 0.14, 0.17, 7.2, cream, -4.51, 0.2, 0);
  box(home, 9.4, 0.13, 0.23, ink, 0, 2.87, -3.65);
  box(home, 0.23, 0.13, 7.35, ink, -4.65, 2.87, 0);
  // Door and moonlit nursery window.
  const door = group(scene, "front-door", -0.3, 0, -3.51);
  box(door, 1.26, 2.42, 0.14, cream, 0, 1.31, 0);
  const doorPanel = box(door, 1.08, 2.24, 0.16, mat("#446274"), 0, 1.27, 0.07);
  box(door, 0.78, 1.05, 0.04, blue, 0, 1.62, 0.17);
  const doorKnob = ball(door, 0.36, 1.07, 0.2, 0.07, 0.07, 0.07, mat("#f8c86b", 0.3));
  box(home, 1.86, 1.64, 0.13, cream, 2.55, 1.88, -3.48);
  box(home, 1.61, 1.38, 0.14, mat("#102947", 0.62, { emissive: "#174e85", emissiveIntensity: 0.45 }), 2.55, 1.88, -3.4);
  box(home, 0.07, 1.42, 0.04, cream, 2.55, 1.88, -3.3);
  box(home, 1.61, 0.07, 0.04, cream, 2.55, 1.88, -3.3);
  ball(home, 2.98, 2.28, -3.3, 0.19, 0.19, 0.035, mat("#d8ebff", 0.82, { emissive: "#a9d0ff", emissiveIntensity: 0.75 }));
  for (let i = 0; i < 7; i++) ball(home, 1.9 + (i * 0.33) % 1.2, 1.36 + (i * 0.41) % 1.13, -3.29, 0.018, 0.018, 0.01, white);

  const kitchen = group(scene, "water-station", -3.3, 0, -2.55);
  box(kitchen, 2.15, 0.95, 1.13, blue, 0, 0.58, 0);
  box(kitchen, 2.3, 0.15, 1.25, cream, 0, 1.12, 0);
  for (const x of [-0.53, 0.53]) { box(kitchen, 0.91, 0.72, 0.03, mat("#91b5bd"), x, 0.6, 0.58); box(kitchen, 0.23, 0.055, 0.08, cream, x, 0.83, 0.62); }
  box(kitchen, 0.8, 0.065, 0.65, ink, -0.45, 1.23, 0);
  rod(kitchen, [-0.45, 1.23, -0.35], [-0.45, 1.61, -0.35], 0.05, cream);
  rod(kitchen, [-0.45, 1.61, -0.35], [-0.45, 1.61, 0], 0.05, cream);
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.25, 24), coral); mug.position.set(0.58, 1.33, 0.1); kitchen.add(mug);
  const mugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.035, 8, 20), coral); mugHandle.position.set(0.76, 1.34, 0.1); kitchen.add(mugHandle);

  const rug = group(scene, "nursery-rug", 0.65, 0.11, 0.6);
  box(rug, 4.45, 0.05, 3.65, mat("#344f71", 0.95, { kind: "cloth", grain: 0.45, repeat: 3, bumpScale: 0.012 }), 0, 0, 0, 0.02);
  box(rug, 4.1, 0.015, 3.3, mat("#57718e", 0.95, { kind: "cloth", grain: 0.55, repeat: 3, bumpScale: 0.012 }), 0, 0.03, 0, 0.004);
  for (let i = 0; i < 15; i++) {
    const x = -1.92 + i * 0.27;
    rod(rug, [x, 0, -1.8], [x, 0, -1.98], 0.018, cream);
    rod(rug, [x, 0, 1.8], [x, 0, 1.98], 0.018, cream);
  }
  const sofa = group(scene, "sofa", -3.05, 0, 1.05);
  box(sofa, 1.75, 0.56, 2.25, coral, 0, 0.42, 0, 0.18);
  box(sofa, 0.3, 1.05, 2.35, coral, -0.77, 0.79, 0, 0.14);
  for (const z of [-1.02, 1.02]) box(sofa, 1.75, 0.36, 0.32, coral, 0, 0.91, z, 0.14);
  for (const z of [-0.49, 0.49]) box(sofa, 1.3, 0.2, 0.88, mat("#eaa294", 0.9, { kind: "cloth", grain: 0.45, repeat: 2, bumpScale: 0.008 }), 0.14, 0.76, z, 0.09);
  const pillow = box(sofa, 0.26, 0.58, 0.57, cream, -0.47, 1.06, 0.54, 0.12); pillow.rotation.x = 0.22;

  // Low front crib rail keeps the baby's face readable from the game camera.
  const crib = group(scene, "baby-crib", 2.7, 0, -1.8);
  box(crib, 2.15, 0.19, 1.72, oak, 0, 0.76, 0);
  box(crib, 1.99, 0.18, 1.57, white, 0, 0.93, 0, 0.09);
  for (const x of [-1.02, 1.02]) for (const z of [-0.79, 0.79]) box(crib, 0.13, 1.34, 0.13, cream, x, 0.77, z);
  for (const z of [-0.8, 0.8]) {
    const top = z < 0 ? 1.48 : 1.1;
    box(crib, 2.15, 0.12, 0.13, cream, 0, top, z);
    for (let i = 0; i < 10; i++) rod(crib, [-0.91 + i * 0.2, 0.85, z], [-0.91 + i * 0.2, top, z], 0.025, cream);
  }
  for (const x of [-1.03, 1.03]) box(crib, 0.1, 0.6, 1.6, cream, x, 1.18, 0);
  const nightstand = group(scene, "nightlight", 4, 0, 0.02);
  box(nightstand, 0.85, 0.78, 0.85, oak, 0, 0.49, 0);
  box(nightstand, 0.96, 0.12, 0.96, cream, 0, 0.94, 0);
  rod(nightstand, [0, 1, 0], [0, 1.52, 0], 0.065, oak);
  const lampshade = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.43, 0.45, 32), mat("#ebba72", 0.9, { kind: "cloth", grain: 0.35, emissive: "#ffae48", emissiveIntensity: 0.38 }));
  lampshade.position.set(0, 1.6, 0); nightstand.add(lampshade);
  const lamp = new THREE.PointLight("#ffb35d", 16, 8, 2); lamp.position.set(4, 1.35, 0); lamp.userData.tag = "light-nightlight"; scene.add(lamp);

  // Oversized nursery clutter makes the upcoming hazards readable.
  const toys = group(scene, "noisy-toys", 2.5, 0.13, 1.65);
  const toyBlocks = [];
  for (const [x,z,c] of [[0,0,"#e99b71"],[0.43,0.39,"#e1c16d"],[-0.48,0.55,"#8dbabc"]]) {
    const b = box(toys, 0.37, 0.36, 0.37, mat(c), x, 0.18, z); b.rotation.y = x * 2; toyBlocks.push(b);
  }
  const duck = group(scene, "squeaky-duck", 1.24, 0.22, 2.8);
  ball(duck, 0, 0, 0, 0.3, 0.23, 0.35, mat("#f7c75d"));
  ball(duck, 0, 0.26, 0.13, 0.2, 0.2, 0.2, mat("#f7c75d"));
  ball(duck, 0, 0.2, 0.33, 0.14, 0.055, 0.12, coral);
  for (const x of [-0.14, 0.14]) ball(duck, x, 0.3, 0.25, 0.027, 0.027, 0.027, ink);
  const pacifier = group(scene, "pacifier", 0.7, 0.18, -0.43);
  ball(pacifier, 0, 0, 0, 0.15, 0.04, 0.1, coral);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 20), cream); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.045, 0); pacifier.add(ring);

  const bunny = group(scene, "plush-bunny", 3.45, 0.12, 2.25);
  bunny.rotation.y = -0.2;
  let resetBunnyModel = () => {};
  const bunnyReady = new Promise(resolve => new GLTFLoader().load(BUNNY_ASSET_PATH, ({ scene: model }) => {
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 0.95 / Math.max(size.y, 0.001);
    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    model.traverse(obj => { if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; } });
    bunny.add(model);
    resetBunnyModel = capturePoses([model]);
    bunny.userData.loaded = true;
    resolve(model);
  }, undefined, error => {
    console.error("Nursery bunny failed to load", error);
    resolve(null);
  }));

  const ambient = new THREE.HemisphereLight("#95b3ec", "#775948", 1.05);
  ambient.userData.tag = "light-ambient"; scene.add(ambient);
  const key = new THREE.DirectionalLight("#e3d5cb", 1.6);
  key.position.set(-3, 9, 5); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -8; key.shadow.camera.right = 8;
  key.shadow.camera.top = 8; key.shadow.camera.bottom = -8; key.shadow.normalBias = 0.035; key.shadow.bias = -0.0001; key.shadow.radius = 4;
  key.userData.tag = "light-key"; scene.add(key);
  const rim = new THREE.DirectionalLight("#78abff", 1.3); rim.position.set(2, 4, -6); rim.userData.tag = "light-rim"; scene.add(rim);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat("#18253f"));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.51; ground.receiveShadow = true; ground.userData.tag = "ground"; scene.add(ground);


  // World-space X/Z AABBs in metres; a moving parent expands these by its body radius.
  // Floor clutter is a noise hazard rather than solid furniture. Bounds represent both walls
  // and open dollhouse edges, so future movement stays on the authored floor.
  function footprint(id, object, blocking = true) {
    const bounds = new THREE.Box3().setFromObject(object);
    return { id, object, blocking, minX: bounds.min.x, maxX: bounds.max.x,
      minZ: bounds.min.z, maxZ: bounds.max.z };
  }
  const collisionFootprints = [
    footprint("sink", kitchen), footprint("sofa", sofa), footprint("crib", crib),
    footprint("nightlight", nightstand), footprint("door", door),
    footprint("toys", toys, false), footprint("duck", duck, false),
    { id: "bunny", object: bunny, blocking: false, minX: 3.1, maxX: 3.8, minZ: 1.9, maxZ: 2.6 },
  ];
  // Freeze the original authored footprints BEFORE cosmetic detailing. Decoration never
  // becomes a solid obstacle and task target/group positions retain their original values.
  const atmosphere = dressNightHome(scene, { home, sofa, crib, nightstand, toys, toyBlocks,
    pacifier, ring, kitchen, mug, mugHandle, door, lamp, cream, oak, ink });
  const resetPoses = capturePoses([home, door, kitchen, rug, sofa, crib, nightstand, toys, duck,
    pacifier, bunny, ambient, key, rim, lamp, ground, atmosphere.root]);
  return {
    home, materials, atmosphere, sink: kitchen, kitchen, door, doorPanel, doorKnob, pacifier, toys, toyBlocks, duck, crib,
    nightlight: nightstand, lampshade, lamp, mug, mugHandle, ring, rug, sofa, pillow,
    bunny, bunnyReady, ground, lights: { ambient, key, rim, lamp }, collisionFootprints,
    bounds: { minX: -4.45, maxX: 4.45, minZ: -3.4, maxZ: 3.5 },
    taskTargets: { water: kitchen, pacifier, toy: toys, door },
    reset(seed) { resetPoses(); resetBunnyModel(); },
  };
}
