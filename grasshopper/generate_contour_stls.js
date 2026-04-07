// Generate flat plan-view STL of each contour type
// MATCHES the web/test geometry exactly: radius = RADIUS + OFFSET * bump(theta)
// Run: node generate_contour_stls.js

const fs = require('fs');
const path = require('path');
const PI = Math.PI;
const ANG_RES = 480;
const RADIUS = 50;
const OFFSET = 6;
const THICKNESS = 2;
const PROTRUSIONS = 24;

// Bump functions — identical to web (myo/vase1/index.html)
function getLocalT(theta) {
  const sliceAngle = (2 * PI) / PROTRUSIONS;
  const phase = ((theta % (2 * PI)) + 2 * PI) % (2 * PI);
  return (phase / sliceAngle) % 1.0;
}

function flowerBump(theta) {
  return Math.sin(getLocalT(theta) * PI);
}
function sunBump(theta) {
  return 1.0 - 2.0 * Math.abs(getLocalT(theta) - 0.5);
}
function rectBump(theta) {
  const t = getLocalT(theta);
  const s = 80;
  return 1.0 / (1.0 + Math.exp(-s * (t - 0.18)))
       - 1.0 / (1.0 + Math.exp(-s * (t - 0.82)));
}

function getRadius(theta, bumpFn) {
  return RADIUS + OFFSET * bumpFn(theta);
}

function writeSTL(filepath, bumpFn) {
  const verts = [];
  for (let a = 0; a < ANG_RES; a++) {
    const theta = (2 * PI * a) / ANG_RES;
    const r = getRadius(theta, bumpFn);
    verts.push([r * Math.cos(theta), r * Math.sin(theta), 0]);
  }
  for (let a = 0; a < ANG_RES; a++) {
    const theta = (2 * PI * a) / ANG_RES;
    const r = getRadius(theta, bumpFn);
    verts.push([r * Math.cos(theta), r * Math.sin(theta), THICKNESS]);
  }
  const botC = verts.length; verts.push([0, 0, 0]);
  const topC = verts.length; verts.push([0, 0, THICKNESS]);

  const tris = [];
  for (let j = 0; j < ANG_RES; j++) {
    tris.push([botC, (j+1)%ANG_RES, j]);
    tris.push([topC, ANG_RES+j, ANG_RES+(j+1)%ANG_RES]);
    const b0=j, b1=(j+1)%ANG_RES, t0=ANG_RES+j, t1=ANG_RES+(j+1)%ANG_RES;
    tris.push([b0,b1,t1]); tris.push([b0,t1,t0]);
  }

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

  // Verify bounds
  let minR=Infinity, maxR=-Infinity;
  for(let a=0;a<3600;a++){const t=(2*PI*a)/3600;const r=getRadius(t,bumpFn);minR=Math.min(minR,r);maxR=Math.max(maxR,r);}
  console.log(`  ${path.basename(filepath)}: ${numTri} tris, inner=${minR.toFixed(1)}mm, outer=${maxR.toFixed(1)}mm`);
}

const outDir = path.join(__dirname, '..', 'exports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

console.log('Generating contour STLs (radius = 50 + 6*bump, same as web):');
writeSTL(path.join(outDir, 'contour-flower.stl'), flowerBump);
writeSTL(path.join(outDir, 'contour-sun.stl'), sunBump);
writeSTL(path.join(outDir, 'contour-rectangle.stl'), rectBump);
console.log('Done!');
