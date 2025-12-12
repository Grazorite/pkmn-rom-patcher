const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');



function validateMetadata(meta, filename) {
  const warnings = [];
  const essentialFields = ['baseRom', 'system', 'status', 'author'];
  const missing = essentialFields.filter(field => !meta[field]);
  
  if (missing.length > 0) {
    warnings.push(`Missing essential fields in ${filename}: ${missing.join(', ')}`);
  }
  
  return { isValid: missing.length === 0, warnings };
}

function scanPatchesDirectory(patchesDir, metadataDir) {
  const patches = [];
  
  if (!fs.existsSync(patchesDir)) {
    console.warn(`Patches directory not found: ${patchesDir}`);
    return patches;
  }
  
  // Scan base ROM directories
  const baseRomDirs = fs.readdirSync(patchesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  for (const baseRom of baseRomDirs) {
    const baseRomPatchDir = path.join(patchesDir, baseRom);
    const baseRomMetadataDir = path.join(metadataDir, baseRom);
    
    if (!fs.existsSync(baseRomMetadataDir)) {
      console.warn(`Metadata directory not found for ${baseRom}: ${baseRomMetadataDir}`);
      continue;
    }
    
    // Get all patch files in this base ROM directory
    const patchFiles = fs.readdirSync(baseRomPatchDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile())
      .filter(dirent => {
        const ext = path.extname(dirent.name).toLowerCase().slice(1);
        return ['ips', 'bps', 'ups', 'xdelta'].includes(ext);
      });
    
    for (const patchFile of patchFiles) {
      const patchPath = path.join(baseRomPatchDir, patchFile.name);
      const baseName = path.basename(patchFile.name, path.extname(patchFile.name));
      const metadataPath = path.join(baseRomMetadataDir, `${baseName}.md`);
      
      let meta = {};
      let changelog = null;
      let isIncomplete = false;
      
      // Try to load metadata
      if (fs.existsSync(metadataPath)) {
        try {
          const mdContent = fs.readFileSync(metadataPath, 'utf8');
          const parsed = matter(mdContent);
          meta = parsed.data;
          changelog = parsed.content.trim();
          
          const validation = validateMetadata(meta, `${baseRom}/${baseName}.md`);
          if (validation.warnings.length > 0) {
            validation.warnings.forEach(warning => console.warn(warning));
          }
          isIncomplete = !validation.isValid;
        } catch (e) {
          console.warn(`Error parsing ${baseRom}/${baseName}.md: ${e.message}`);
          isIncomplete = true;
        }
      } else {
        console.warn(`No metadata file found for ${baseRom}/${patchFile.name}`);
        isIncomplete = true;
      }
      
      // Extract CRC32 from filename if present
      const crc32Match = baseName.match(/\[([A-Fa-f0-9]{8})\]/);
      const cleanName = baseName.replace(/\s*\[([A-Fa-f0-9]{8})\]\s*/, '');
      const id = `${baseRom.toLowerCase()}-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      
      // Create relative path from docs/ directory
      const relativePath = '../' + path.relative(
        path.join(__dirname, '..'), 
        patchPath
      ).replace(/\\/g, '/');
      
      // Build patch entry
      const patchEntry = {
        id,
        title: meta.title || cleanName,
        file: relativePath,
        type: path.extname(patchFile.name).toLowerCase().slice(1),
        baseRom: baseRom,
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

// Main execution
const patchesDir = path.join(__dirname, '..', 'patches');
const metadataDir = path.join(__dirname, '..', 'metadata');
const outputFile = path.join(__dirname, '..', 'docs', 'manifest.json');

// Ensure directories exist
if (!fs.existsSync(patchesDir)) {
  fs.mkdirSync(patchesDir, { recursive: true });
}
if (!fs.existsSync(metadataDir)) {
  fs.mkdirSync(metadataDir, { recursive: true });
}

const patches = scanPatchesDirectory(patchesDir, metadataDir);
const incompleteCount = patches.filter(p => p.incomplete).length;

fs.writeFileSync(outputFile, JSON.stringify(patches, null, 2));

console.log(`Generated manifest with ${patches.length} patches`);
if (incompleteCount > 0) {
  console.warn(`${incompleteCount} patches have incomplete metadata`);
}