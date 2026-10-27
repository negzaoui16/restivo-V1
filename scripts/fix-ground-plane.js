const fs = require('fs');
const path = require('path');

function fixGroundPlane(filePath) {
  const fileBuf = fs.readFileSync(filePath);
  const magic = fileBuf.readUInt32LE(0);
  if (magic !== 0x46546C67) return false;

  const chunk0Length = fileBuf.readUInt32LE(12);
  const jsonStr = fileBuf.toString('utf8', 20, 20 + chunk0Length);
  const gltf = JSON.parse(jsonStr);

  const binHeaderOffset = 20 + chunk0Length;
  if (binHeaderOffset >= fileBuf.length) return false;

  const binChunkLength = fileBuf.readUInt32LE(binHeaderOffset);
  const binDataOffset = binHeaderOffset + 8;
  const binBuffer = Buffer.from(fileBuf.subarray(binDataOffset, binDataOffset + binChunkLength));

  let modified = false;

  for (const mesh of gltf.meshes || []) {
    for (const prim of mesh.primitives || []) {
      if (prim.attributes.POSITION === undefined) continue;

      const posAccessorIdx = prim.attributes.POSITION;
      const posAccessor = gltf.accessors[posAccessorIdx];
      const posBufferView = gltf.bufferViews[posAccessor.bufferView];
      const posByteOffset = (posBufferView.byteOffset || 0) + (posAccessor.byteOffset || 0);
      const vertexCount = posAccessor.count;

      let minY = Infinity;
      let maxY = -Infinity;

      for (let i = 0; i < vertexCount; i++) {
        const y = binBuffer.readFloatLE(posByteOffset + i * 12 + 4);
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }

      console.log(`[${path.basename(filePath)}] Current minY: ${minY}, maxY: ${maxY}`);

      if (Math.abs(minY) > 0.0001) {
        // Shift all Y coordinates so the lowest point is exactly Y = 0
        for (let i = 0; i < vertexCount; i++) {
          const currentY = binBuffer.readFloatLE(posByteOffset + i * 12 + 4);
          const newY = currentY - minY;
          binBuffer.writeFloatLE(newY, posByteOffset + i * 12 + 4);
        }

        posAccessor.min[1] = 0.0;
        posAccessor.max[1] = maxY - minY;

        // Reset any translation in the parent node so it's not double-shifted
        for (const node of gltf.nodes || []) {
          if (node.translation && Array.isArray(node.translation)) {
            node.translation[1] = 0.0;
          }
        }

        modified = true;
        console.log(`  -> Fixed ground plane: new minY = 0.0, new maxY = ${maxY - minY}`);
      }
    }
  }

  if (!modified) return false;

  // Re-encode GLB
  const newJsonStr = JSON.stringify(gltf);
  const jsonBuffer = Buffer.from(newJsonStr, 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const paddedJsonBuffer = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);

  const binPadding = (4 - (binBuffer.length % 4)) % 4;
  const paddedBinBuffer = Buffer.concat([binBuffer, Buffer.alloc(binPadding, 0x00)]);

  const totalLength = 12 + 8 + paddedJsonBuffer.length + 8 + paddedBinBuffer.length;
  const outBuf = Buffer.alloc(totalLength);

  outBuf.writeUInt32LE(0x46546C67, 0); // glTF magic
  outBuf.writeUInt32LE(2, 4);          // version 2
  outBuf.writeUInt32LE(totalLength, 8); // total length

  outBuf.writeUInt32LE(paddedJsonBuffer.length, 12);
  outBuf.writeUInt32LE(0x4E4F534A, 16); // JSON
  paddedJsonBuffer.copy(outBuf, 20);

  const binHeaderStart = 20 + paddedJsonBuffer.length;
  outBuf.writeUInt32LE(paddedBinBuffer.length, binHeaderStart);
  outBuf.writeUInt32LE(0x004E4942, binHeaderStart + 4); // BIN
  paddedBinBuffer.copy(outBuf, binHeaderStart + 8);

  fs.writeFileSync(filePath, outBuf);
  console.log(`  -> Successfully saved ${filePath} (${totalLength} bytes)`);
  return true;
}

const dir = path.join(__dirname, '..', 'public', 'models');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.glb'));
let count = 0;
for (const file of files) {
  if (fixGroundPlane(path.join(dir, file))) count++;
}
console.log(`Finished fixing ground planes: ${count} files modified.`);
