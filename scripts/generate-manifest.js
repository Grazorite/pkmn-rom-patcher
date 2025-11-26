const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const REQUIRED_FIELDS = [
  'baseRom', 'system', 'status', 'author', 'website', 'released',
  'hackType', 'tags', 'graphics', 'story', 'maps', 'postgame',
  'difficulty', 'mechanics', 'fakemons', 'variants', 'typeChanges',
  'physicalSpecialSplit', 'antiCheat'
];

const VALID_SYSTEMS = ['GBA', 'NDS', 'GBC', 'GB', 'N64', 'SNES', 'NES'];
const VALID_STATUS = ['Completed', 'Beta', 'Alpha', 'Demo', 'Cancelled'];
const VALID_HACK_TYPES = ['New', 'Improvement'];
const VALID_ENUMS = ['New', 'Enhanced', 'Same'];
const VALID_POSTGAME = ['Yes', 'No', 'N/A'];
const VALID_DIFFICULTY = ['Easy', 'Normal', 'Hard', 'Kaizo', 'Extreme'];
const VALID_FAKEMONS = ['All', 'Majority', 'Some', 'None'];

function validateMetadata(meta, filename) {
  const warnings = [];
  const missing = REQUIRED_FIELDS.filter(field => !meta[field]);
  
  if (missing.length > 0) {
    warnings.push(`Missing required fields in ${filename}: ${missing.join(', ')}`);
  }
  
  if (meta.system && !VALID_SYSTEMS.includes(meta.system)) {
    warnings.push(`Invalid system in ${filename}: ${meta.system}`);
  }
  
  return { isValid: missing.length === 0, warnings };
}

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
        patchFiles.set(baseName, { ...patchFiles.get(baseName), mdFile: file.name, mdPath: fullPath });
      }
    }
  }
  
  // Second pass: build patch objects
  for (const [baseName, files] of patchFiles) {
    if (files.patchFile) {
      const crc32Match = baseName.match(/\[([A-Fa-f0-9]{8})\]/);
      const cleanName = baseName.replace(/\s*\[([A-Fa-f0-9]{8})\]\s*/, '');
      const id = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const relativePath = path.relative(path.join(__dirname, '..', 'docs'), files.fullPath).replace(/\\/g, '/');
      
      let meta = {};
      let changelog = null;
      let isIncomplete = false;
      
      if (files.mdFile && files.mdPath) {
        try {
          const mdContent = fs.readFileSync(files.mdPath, 'utf8');
          const parsed = matter(mdContent);
          meta = parsed.data;
          changelog = parsed.content.trim();
          
          const validation = validateMetadata(meta, files.mdFile);
          if (validation.warnings.length > 0) {
            validation.warnings.forEach(warning => console.warn(warning));
          }
          isIncomplete = !validation.isValid;
        } catch (e) {
          console.warn(`Error parsing ${files.mdFile}: ${e.message}`);
          isIncomplete = true;
        }
      } else {
        console.warn(`No metadata file found for ${files.patchFile}`);
        isIncomplete = true;
      }
      
      // Structure metadata
      const patchEntry = {
        id,
        title: meta.title || cleanName,
        file: relativePath,
        type: files.ext,
        ...(crc32Match && { crc32: crc32Match[1].toUpperCase() }),
        ...(isIncomplete && { incomplete: true }),
        meta: {
          ...meta,
          ...(meta.boxArt || meta.bannerImage) && {
            images: {
              ...(meta.boxArt && { boxArt: meta.boxArt }),
              ...(meta.bannerImage && { banner: meta.bannerImage })
            }
          },
          ...(meta.website || meta.discord || meta.documentation) && {
            links: {
              ...(meta.website && { website: meta.website }),
              ...(meta.discord && { discord: meta.discord }),
              ...(meta.documentation && { documentation: meta.documentation })
            }
          }
        },
        ...(changelog && { changelog })
      };
      
      // Clean up duplicated fields
      delete patchEntry.meta.boxArt;
      delete patchEntry.meta.bannerImage;
      delete patchEntry.meta.website;
      delete patchEntry.meta.discord;
      delete patchEntry.meta.documentation;
      delete patchEntry.meta.title;
      
      patches.push(patchEntry);
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
const incompleteCount = patches.filter(p => p.incomplete).length;

fs.writeFileSync(outputFile, JSON.stringify(patches, null, 2));

console.log(`Generated manifest with ${patches.length} patches`);
if (incompleteCount > 0) {
  console.warn(`${incompleteCount} patches have incomplete metadata`);
}