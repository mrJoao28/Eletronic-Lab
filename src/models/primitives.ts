import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  ShapeGeometry,
  TubeGeometry,
  CatmullRomCurve3,
  Vector3,
} from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json' with { type: 'json' };

const font = new FontLoader().parse(fontData);
export const material = (color: string, metalness = 0, roughness = 0.5) =>
  new MeshStandardMaterial({ color, metalness, roughness, side: DoubleSide });
export const metal = material('#b7c4c7', 0.82, 0.27);
export const gold = material('#d7af54', 0.78, 0.28);
export const black = material('#202629', 0.12, 0.65);
export const white = material('#e2e5d3', 0, 0.7);
export function box(
  parent: Group,
  name: string,
  size: [number, number, number],
  at: [number, number, number],
  mat = black,
) {
  const mesh = new Mesh(new BoxGeometry(...size), mat);
  mesh.name = name;
  mesh.position.set(...at);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function cylinder(
  parent: Group,
  name: string,
  radius: number,
  height: number,
  at: [number, number, number],
  mat = metal,
) {
  const mesh = new Mesh(new CylinderGeometry(radius, radius, height, 24), mat);
  mesh.name = name;
  mesh.position.set(...at);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
export function label(
  parent: Group,
  text: string,
  x: number,
  y: number,
  z: number,
  size = 1,
  mat = white,
) {
  const mesh = new Mesh(new ShapeGeometry(font.generateShapes(text, size), 3), mat);
  mesh.name = `marking-${text}`;
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  parent.add(mesh);
}
export function tube(parent: Group, name: string, points: number[][], radius: number, mat = metal) {
  const curve = new CatmullRomCurve3(
    points.map((p) => new Vector3(...(p as [number, number, number]))),
  );
  const mesh = new Mesh(new TubeGeometry(curve, 18, radius, 6, false), mat);
  mesh.name = name;
  mesh.castShadow = true;
  parent.add(mesh);
}
