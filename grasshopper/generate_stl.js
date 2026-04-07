// Generate STL of the default vase config with new contour construction
// Inner circle + 24 protrusions reaching to outer circle (+6mm)
// Run: node generate_stl.js

const fs = require('fs');
const path = require('path');
const PI = Math.PI;
const ANG_RES = 480;
const SEGMENT_HEIGHT = 30;
const CAP_HEIGHT = 60;
const LAYERS_PER_SEG = 10;
const CAP_LAYERS = 20;
const PROTRUSIONS = 24;
const OFFSET = 6;

const segments = [
  { contour: 'flower', width: 50 },
  { contour: 'sun',    width: 55 },
  { contour: 'rect',   width: 60 },
  { contour: 'sun',    width: 55 },
  { contour: 'flower', width: 50 },
];
const hasCap = true;
const mouthWidth = 25;

function flowerContour(theta) {
  const sliceAngle = (2 * PI) / PROTRUSIONS;
  const phase = ((theta % (2 * PI)) + 2 * PI) % (2 * PI);
  const localT = (phase / sliceAngle) % 1.0;
  return 1.0 + (OFFSET / 50) * Math.sin(localT * PI);
}
function sunContour(theta) {
  const sliceAngle = (2 * PI) / PROTRUSIONS;
  const phase = ((theta % (2 * PI)) + 2 * PI) % (2 * PI);
  const localT = (phase / sliceAngle) % 1.0;
  return 1.0 + (OFFSET / 50) * (1.0 - 2.0 * Math.abs(localT - 0.5));
}
function rectContour(theta) {
  const sliceAngle = (2 * PI) / PROTRUSIONS;
  const phase = ((theta % (2 * PI)) + 2 * PI) % (2 * PI);
  const localT = (phase / sliceAngle) % 1.0;
  const s = 80;
  const tab = 1.0/(1.0+Math.exp(-s*(localT-0.18))) - 1.0/(1.0+Math.exp(-s*(localT-0.82)));
  return 1.0 + (OFFSET / 50) * tab;
}
const contourFn = { flower: flowerContour, sun: sunContour, rect: rectContour };

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function getSegRadius(theta, segIdx, localT) {
  const seg = segments[segIdx];
  const botW = segIdx > 0 ? segments[segIdx - 1].width : seg.width;
  const topW = seg.width;
  const w = lerp(botW, topW, localT);
  return contourFn[seg.contour](theta) * w;
}
function getCapRadius(theta, localT) {
  const last = segments[segments.length - 1];
  const lastW = last.width;
  const shapeBlend = clamp(localT / 0.6, 0, 1);
  const shape = lerp(contourFn[last.contour](theta), 1.0, shapeBlend);
  return shape * lerp(lastW, mouthWidth, localT);
}

const vertices = [];
let ringCount = 0;

for (let seg = 0; seg < segments.length; seg++) {
  const start = seg === 0 ? 0 : 1;
  for (let layer = start; layer <= LAYERS_PER_SEG; layer++) {
    const t = layer / LAYERS_PER_SEG;
    const z = seg * SEGMENT_HEIGHT + t * SEGMENT_HEIGHT;
    for (let a = 0; a < ANG_RES; a++) {
      const theta = (2 * PI * a) / ANG_RES;
      const r = getSegRadius(theta, seg, t);
      vertices.push([r * Math.cos(theta), r * Math.sin(theta), z]);
    }
    ringCount++;
  }
}
if (hasCap) {
  const capBase = segments.length * SEGMENT_HEIGHT;
  for (let layer = 1; layer <= CAP_LAYERS; layer++) {
    const t = layer / CAP_LAYERS;
    const z = capBase + t * CAP_HEIGHT;
    for (let a = 0; a < ANG_RES; a++) {
      const theta = (2 * PI * a) / ANG_RES;
      const r = getCapRadius(theta, t);
      vertices.push([r * Math.cos(theta), r * Math.sin(theta), z]);
    }
    ringCount++;
  }
}

const botIdx = vertices.length;
vertices.push([0, 0, 0]);

const tris = [];
for (let i = 0; i < ringCount - 1; i++) {
  for (let j = 0; j < ANG_RES; j++) {
    const c=i*ANG_RES+j, n=i*ANG_RES+(j+1)%ANG_RES;
    const a=(i+1)*ANG_RES+j, an=(i+1)*ANG_RES+(j+1)%ANG_RES;
    tris.push([c,n,an]); tris.push([c,an,a]);
  }
}
for (let j = 0; j < ANG_RES; j++) tris.push([botIdx, (j+1)%ANG_RES, j]);

const numTri = tris.length;
const buf = Buffer.alloc(80 + 4 + numTri * 50);
buf.writeUInt32LE(numTri, 80);
let off = 84;
for (const tri of tris) {
  const vA=vertices[tri[0]], vB=vertices[tri[1]], vC=vertices[tri[2]];
  const e1=[vB[0]-vA[0],vB[1]-vA[1],vB[2]-vA[2]];
  const e2=[vC[0]-vA[0],vC[1]-vA[1],vC[2]-vA[2]];
  const nx=e1[1]*e2[2]-e1[2]*e2[1], ny=e1[2]*e2[0]-e1[0]*e2[2], nz=e1[0]*e2[1]-e1[1]*e2[0];
  const len=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;
  buf.writeFloatLE(nx/len,off);off+=4;buf.writeFloatLE(ny/len,off);off+=4;buf.writeFloatLE(nz/len,off);off+=4;
  for(const v of[vA,vB,vC]){buf.writeFloatLE(v[0],off);off+=4;buf.writeFloatLE(v[1],off);off+=4;buf.writeFloatLE(v[2],off);off+=4;}
  buf.writeUInt16LE(0,off);off+=2;
}

const outDir = path.join(__dirname, '..', 'exports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'vase1-default.stl');
fs.writeFileSync(outFile, buf);
console.log(`Written ${numTri} triangles to ${outFile}`);
