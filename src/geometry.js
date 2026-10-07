import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { bakeTexture } from "./materials.js";

const maps = new Map();

/** Subtle, seeded surface grain keeps the delivered pastel palette and lighting intact. */
export function mappedMaterial(color, roughness = 0.82, { kind = "plaster", seed = 1, ...options } = {}) {
  const key = `${kind}:${seed}`;
  if (!maps.has(key)) {
    const baked = bakeTexture({ kind, seed, size: 64, palette: [0xffffff] });
    const canvas = baked.map.image;
    const ctx = canvas.getContext("2d");
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      for (let c = 0; c < 3; c++) pixels.data[i + c] = 255 - (255 - pixels.data[i + c]) * 0.08;
    }
    ctx.putImageData(pixels, 0, 0);
    baked.map.needsUpdate = true;
    maps.set(key, baked);
  }
  const baked = maps.get(key);
  const material = new THREE.MeshStandardMaterial({
    color, roughness, map: baked.map, bumpMap: baked.bumpMap, bumpScale: 0.002, ...options,
  });
  material.userData.baked = kind;
  return material;
}

export function createMaterials() {
  return {
    cream: mappedMaterial("#ffe5b3"), oak: mappedMaterial("#c98958", 0.82, { kind: "wood" }),
    wall: mappedMaterial("#657b99"), coral: mappedMaterial("#e28e81"),
    blue: mappedMaterial("#799faa"), ink: mappedMaterial("#35455c"),
    skin: mappedMaterial("#f6c194"), hair: mappedMaterial("#553c40"), white: mappedMaterial("#fff4d9"),
  };
}

export function box(parent, w, h, d, material, x, y, z, radius = 0.07) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
  return mesh;
}

export function ball(parent, x, y, z, sx, sy, sz, material) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), material);
  mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
  return mesh;
}

export function rod(parent, from, to, radius, material) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 12), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
  mesh.castShadow = true; parent.add(mesh);
  return mesh;
}

export function group(parent, tag, x = 0, y = 0, z = 0) {
  const object = new THREE.Group();
  object.userData.tag = tag; object.position.set(x, y, z); parent.add(object);
  return object;
}

export function label(parent, text, x, y, z, color = "#ffe7aa", size = 0.65, tag = "world-label") {
  const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.font = "bold 70px Trebuchet MS, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = color; ctx.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthWrite: false }));
  sprite.userData.tag = tag; sprite.position.set(x, y, z); sprite.scale.set(size * 4, size, 1);
  parent.add(sprite);
  return sprite;
}

/** Capture authored local poses once; reset never replaces any shared object handles. */
export function capturePoses(roots) {
  const poses = new Map();
  for (const root of roots) root.traverse(object => {
    if (poses.has(object)) return;
    poses.set(object, {
      position: object.position.clone(), quaternion: object.quaternion.clone(), scale: object.scale.clone(),
      visible: object.visible, intensity: object.isLight ? object.intensity : undefined,
    });
  });
  return () => {
    for (const [object, pose] of poses) {
      object.position.copy(pose.position); object.quaternion.copy(pose.quaternion); object.scale.copy(pose.scale);
      object.visible = pose.visible;
      if (object.isLight) object.intensity = pose.intensity;
    }
  };
}
