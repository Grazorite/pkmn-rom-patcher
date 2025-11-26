const fs = require('fs');
const path = require('path');

function scanPatches(dir) {
  const patches = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  const patchFiles = new Map();
  
  // First pass: collect all files
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      patches.push(...scanPatches(fullPath));
    } else if (file.isFile()) {
      const ext = path.extname(file.name).toLowerCase().slice(1);
      const baseName = path.basename(file.name, path.extname(file.name));
      
      if (['ips', 'bps', 'ups', 'xdelta'].includes(ext)) {
        patchFiles.set(baseName, { ...patchFiles.get(baseName), patchFile: file.name, fullPath, ext });
      } else if (ext === 'md') {
        patchFiles.set(baseName, { ...patchFiles.get(baseName), mdFile: file.name });
      }
    }
  }
  
  // Second pass: build patch objects
  for (const [baseName, files] of patchFiles) {
    if (files.patchFile) {
      const crc32Match = baseName.match(/\[([A-Fa-f0-9]{8})\]/);
      const cleanName = baseName.replace(/\s*\[([A-Fa-f0-9]{8})\]\s*/, '');
      const id = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      let changelog = null;
      if (files.mdFile) {
        const mdPath = path.join(path.dirname(files.fullPath), files.mdFile);
        try {
          changelog = fs.readFileSync(mdPath, 'utf8');
        } catch (e) {}
      }
      
      const relativePath = path.relative(path.join(__dirname, '..', 'docs'), files.fullPath).replace(/\\/g, '/');
      
      patches.push({
        id,
        name: cleanName,
        file: relativePath,
        type: files.ext,
        ...(crc32Match && { crc32: crc32Match[1].toUpperCase() }),
        ...(changelog && { changelog })
      });
    }
  }
  
  return patches;
}

const patchesDir = path.join(__dirname, '..', 'patches');
const outputFile = path.join(__dirname, '..', 'docs', 'manifest.json');

if (!fs.existsSync(patchesDir)) {
  fs.mkdirSync(patchesDir, { recursive: true });
}

const patches = fs.existsSync(patchesDir) ? scanPatches(patchesDir) : [];
fs.writeFileSync(outputFile, JSON.stringify(patches, null, 2));

console.log(`Generated manifest with ${patches.length} patches`);