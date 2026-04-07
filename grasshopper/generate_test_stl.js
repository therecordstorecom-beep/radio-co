// Test: generate 3 single-segment STLs at same width (60mm)
// to verify inner/outer radius is identical across contour types
// Run: node generate_test_stl.js

const fs = require('fs');
const path = require('path');
const PI = Math.PI;
const ANG_RES = 72;
const HEIGHT = 30;
const LAYERS = 10;
const PROTRUSIONS = 24;
const OFFSET = 6;
const WIDTH = 60; // same for all

function flowerBump(theta) {
  const sliceAngle = (2 * PI) / PROTRUSIONS;
  const phase = ((theta % (2 * PI)) + 2 * PI) % (2 * PI);
  const localT = (phase / sliceAngle) % 1.0;
  return Math.sin(localT * PI);
}
function sunBump(theta) {
  const sliceAngle = (2 * PI) / PROTRUSIONS;
  const phase = ((theta % (2 * PI)) + 2 * PI) % (2 * PI);
  const localT = (phase / sliceAngle) % 1.0;
  return 1.0 - 2.0 * Math.abs(localT - 0.5);
}
function rectBump(theta) {
  const sliceAngle = (2 * PI) / PROTRUSIONS;
  const phase = ((theta % (2 * PI)) + 2 * PI) % (2 * PI);
  const localT = (phase / sliceAngle) % 1.0;
  const s = 30;
  return 1.0/(1.0+Math.exp(-s*(localT-0.2))) - 1.0/(1.0+Math.exp(-s*(localT-0.8)));
}

function writeSegmentSTL(filepath, bumpFn, zOffset) {
  const verts = [];
  let ringCount = 0;

  for (let layer = 0; layer <= LAYERS; layer++) {
    const z = zOffset + (layer / LAYERS) * HEIGHT;
    for (let a = 0; a < ANG_RES; a++) {
      const theta = (2 * PI * a) / ANG_RES;
      const r = WIDTH + OFFSET * bumpFn(theta);
      verts.push([r * Math.cos(theta), r * Math.sin(theta), z]);
    }
    ringCount++;
  }

  // Bottom center
  const botIdx = verts.length;
  verts.push([0, 0, zOffset]);

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
    const vA=verts[tri[0]], vB=verts[tri[1]], vC=verts[tri[2]];
    const e1=[vB[0]-vA[0],vB[1]-vA[1],vB[2]-vA[2]];
    const e2=[vC[0]-vA[0],vC[1]-vA[1],vC[2]-vA[2]];
    const nx=e1[1]*e2[2]-e1[2]*e2[1], ny=e1[2]*e2[0]-e1[0]*e2[2], nz=e1[0]*e2[1]-e1[1]*e2[0];
    const len=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;
    buf.writeFloatLE(nx/len,off);off+=4;buf.writeFloatLE(ny/len,off);off+=4;buf.writeFloatLE(nz/len,off);off+=4;
    for(const v of[vA,vB,vC]){buf.writeFloatLE(v[0],off);off+=4;buf.writeFloatLE(v[1],off);off+=4;buf.writeFloatLE(v[2],off);off+=4;}
    buf.writeUInt16LE(0,off);off+=2;
  }
  fs.writeFileSync(filepath, buf);
  console.log(`  ${path.basename(filepath)}: inner=${WIDTH}mm, outer=${WIDTH+OFFSET}mm`);
}

// Also print min/max radius for each type to verify
function checkRadiusBounds(name, bumpFn) {
  let minR = Infinity, maxR = -Infinity;
  for (let a = 0; a < 3600; a++) {
    const theta = (2 * PI * a) / 3600;
    const r = WIDTH + OFFSET * bumpFn(theta);
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
  }
  console.log(`  ${name}: min radius = ${minR.toFixed(2)}mm, max radius = ${maxR.toFixed(2)}mm`);
}

const outDir = path.join(__dirname, '..', 'exports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

console.log('\nRadius verification (all at width=60mm, offset=6mm):');
checkRadiusBounds('flower', flowerBump);
checkRadiusBounds('sun', sunBump);
checkRadiusBounds('rect', rectBump);

console.log('\nGenerating test segments (same width, different contours):');
writeSegmentSTL(path.join(outDir, 'test-flower-60mm.stl'), flowerBump, 0);
writeSegmentSTL(path.join(outDir, 'test-sun-60mm.stl'), sunBump, 0);
writeSegmentSTL(path.join(outDir, 'test-rect-60mm.stl'), rectBump, 0);

// Also generate a stacked version
console.log('\nGenerating stacked test (flower→sun→rect, all width=60mm):');
writeSegmentSTL(path.join(outDir, 'test-stacked-flower.stl'), flowerBump, 0);
writeSegmentSTL(path.join(outDir, 'test-stacked-sun.stl'), sunBump, 30);
writeSegmentSTL(path.join(outDir, 'test-stacked-rect.stl'), rectBump, 60);
console.log('Done! Import all 3 stacked files into Rhino to see them together.');
