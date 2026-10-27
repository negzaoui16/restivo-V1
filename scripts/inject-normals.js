const fs = require('fs');
const path = require('path');

function addNormalsToGlb(filePath) {
  const fileBuf = fs.readFileSync(filePath);
  const magic = fileBuf.readUInt32LE(0);
  if (magic !== 0x46546C67) {
    console.log('Skipping non-GLB:', filePath);
    return false;
  }

  const chunk0Length = fileBuf.readUInt32LE(12);
  const jsonStr = fileBuf.toString('utf8', 20, 20 + chunk0Length);
  const gltf = JSON.parse(jsonStr);

  const binHeaderOffset = 20 + chunk0Length;
  if (binHeaderOffset >= fileBuf.length) {
    console.log('No binary chunk in GLB:', filePath);
    return false;
  }

  const binChunkLength = fileBuf.readUInt32LE(binHeaderOffset);
  const binDataOffset = binHeaderOffset + 8;
  let binBuffer = fileBuf.subarray(binDataOffset, binDataOffset + binChunkLength);

  let modified = false;

  for (const mesh of gltf.meshes) {
    for (const prim of mesh.primitives) {
      if (prim.attributes.NORMAL !== undefined) {
        console.log('Already has NORMAL attribute:', path.basename(filePath));
        continue;
      }

      const posAccessorIdx = prim.attributes.POSITION;
      const posAccessor = gltf.accessors[posAccessorIdx];
      const posBufferView = gltf.bufferViews[posAccessor.bufferView];
      const posByteOffset = (posBufferView.byteOffset || 0) + (posAccessor.byteOffset || 0);
      const vertexCount = posAccessor.count;

      // Extract positions Float32Array
      const positions = new Float32Array(vertexCount * 3);
      for (let i = 0; i < vertexCount * 3; i++) {
        positions[i] = binBuffer.readFloatLE(posByteOffset + i * 4);
      }

      // Read indices
      const indices = [];
      if (prim.indices !== undefined) {
        const idxAccessor = gltf.accessors[prim.indices];
        const idxBufferView = gltf.bufferViews[idxAccessor.bufferView];
        const idxByteOffset = (idxBufferView.byteOffset || 0) + (idxAccessor.byteOffset || 0);

        if (idxAccessor.componentType === 5123) { // UNSIGNED_SHORT
          for (let i = 0; i < idxAccessor.count; i++) {
            indices.push(binBuffer.readUInt16LE(idxByteOffset + i * 2));
          }
        } else if (idxAccessor.componentType === 5125) { // UNSIGNED_INT
          for (let i = 0; i < idxAccessor.count; i++) {
            indices.push(binBuffer.readUInt32LE(idxByteOffset + i * 4));
          }
        } else if (idxAccessor.componentType === 5121) { // UNSIGNED_BYTE
          for (let i = 0; i < idxAccessor.count; i++) {
            indices.push(binBuffer.readUInt8(idxByteOffset + i));
          }
        }
      } else {
        for (let i = 0; i < vertexCount; i++) indices.push(i);
      }

      // Calculate normals
      const normals = new Float32Array(vertexCount * 3);

      for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i];
        const i1 = indices[i + 1];
        const i2 = indices[i + 2];

        const p0x = positions[i0 * 3], p0y = positions[i0 * 3 + 1], p0z = positions[i0 * 3 + 2];
        const p1x = positions[i1 * 3], p1y = positions[i1 * 3 + 1], p1z = positions[i1 * 3 + 2];
        const p2x = positions[i2 * 3], p2y = positions[i2 * 3 + 1], p2z = positions[i2 * 3 + 2];

        const e1x = p1x - p0x, e1y = p1y - p0y, e1z = p1z - p0z;
        const e2x = p2x - p0x, e2y = p2y - p0y, e2z = p2z - p0z;

        const nx = e1y * e2z - e1z * e2y;
        const ny = e1z * e2x - e1x * e2z;
        const nz = e1x * e2y - e1y * e2x;

        normals[i0 * 3] += nx; normals[i0 * 3 + 1] += ny; normals[i0 * 3 + 2] += nz;
        normals[i1 * 3] += nx; normals[i1 * 3 + 1] += ny; normals[i1 * 3 + 2] += nz;
        normals[i2 * 3] += nx; normals[i2 * 3 + 1] += ny; normals[i2 * 3 + 2] += nz;
      }

      let min = [Infinity, Infinity, Infinity];
      let max = [-Infinity, -Infinity, -Infinity];

      for (let i = 0; i < vertexCount; i++) {
        let nx = normals[i * 3], ny = normals[i * 3 + 1], nz = normals[i * 3 + 2];
        const len = Math.hypot(nx, ny, nz);
        if (len > 1e-6) {
          nx /= len; ny /= len; nz /= len;
        } else {
          nx = 0; ny = 1; nz = 0;
        }
        normals[i * 3] = nx; normals[i * 3 + 1] = ny; normals[i * 3 + 2] = nz;

        min[0] = Math.min(min[0], nx); min[1] = Math.min(min[1], ny); min[2] = Math.min(min[2], nz);
        max[0] = Math.max(max[0], nx); max[1] = Math.max(max[1], ny); max[2] = Math.max(max[2], nz);
      }

      // Convert normals to binary Buffer (Float32LE)
      const normalBytes = Buffer.alloc(vertexCount * 12);
      for (let i = 0; i < vertexCount * 3; i++) {
        normalBytes.writeFloatLE(normals[i], i * 4);
      }

      // Append to binBuffer
      const normalByteOffset = binBuffer.length;
      binBuffer = Buffer.concat([binBuffer, normalBytes]);

      // Add new bufferView
      const newBufferViewIdx = gltf.bufferViews.length;
      gltf.bufferViews.push({
        buffer: 0,
        byteOffset: normalByteOffset,
        byteLength: normalBytes.length
      });

      // Add new accessor
      const newAccessorIdx = gltf.accessors.length;
      gltf.accessors.push({
        bufferView: newBufferViewIdx,
        byteOffset: 0,
        componentType: 5126, // FLOAT
        count: vertexCount,
        type: 'VEC3',
        max: max,
        min: min
      });

      // Update primitive attribute
      prim.attributes.NORMAL = newAccessorIdx;
      gltf.buffers[0].byteLength = binBuffer.length;
      modified = true;
    }
  }

  if (!modified) return false;

  // Re-pack GLB
  let newJsonStr = JSON.stringify(gltf);
  while (newJsonStr.length % 4 !== 0) newJsonStr += ' ';

  const newJsonBuf = Buffer.from(newJsonStr, 'utf8');

  // Pad bin buffer to 4 bytes
  let padBin = 0;
  if (binBuffer.length % 4 !== 0) padBin = 4 - (binBuffer.length % 4);
  const finalBin = padBin > 0 ? Buffer.concat([binBuffer, Buffer.alloc(padBin)]) : binBuffer;

  const totalLength = 12 + 8 + newJsonBuf.length + 8 + finalBin.length;
  const outBuf = Buffer.alloc(totalLength);

  // Header
  outBuf.writeUInt32LE(0x46546C67, 0); // "glTF"
  outBuf.writeUInt32LE(2, 4);          // version 2
  outBuf.writeUInt32LE(totalLength, 8);

  // Chunk 0 (JSON)
  outBuf.writeUInt32LE(newJsonBuf.length, 12);
  outBuf.writeUInt32LE(0x4E4F534A, 16); // "JSON"
  newJsonBuf.copy(outBuf, 20);

  // Chunk 1 (BIN)
  const binOffset = 20 + newJsonBuf.length;
  outBuf.writeUInt32LE(finalBin.length, binOffset);
  outBuf.writeUInt32LE(0x004E4942, binOffset + 4); // "BIN\0"
  finalBin.copy(outBuf, binOffset + 8);

  // Atomic write
  fs.writeFileSync(filePath, outBuf);
  console.log('Successfully injected NORMAL attributes into:', path.basename(filePath));
  return true;
}

// Process all GLB files in public/models
const modelsDir = path.join(process.cwd(), 'public', 'models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.glb'));

let count = 0;
for (const file of files) {
  const fullPath = path.join(modelsDir, file);
  try {
    if (addNormalsToGlb(fullPath)) count++;
  } catch (err) {
    console.error('Error processing', file, err);
  }
}

console.log(`Processed all GLB models. Injected normals into ${count} files.`);
