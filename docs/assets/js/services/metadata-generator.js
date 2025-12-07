// Metadata Generator
export class MetadataGenerator {
    generate(formData) {
        const metadata = {
            id: this.generateId(formData.title, formData.baseRom),
            title: formData.title,
            file: `../patches/${formData.baseRom.toLowerCase()}/${this.sanitizeFilename(formData.title)}.${this.getPatchExtension(formData)}`,
            type: this.getPatchExtension(formData),
            baseRom: formData.baseRom.toLowerCase(),
            meta: {
                baseRom: formData.baseRom,
                author: formData.author,
                version: formData.version || '1.0',
                released: formData.released || new Date().toISOString().split('T')[0],
                status: formData.status || 'Complete',
                difficulty: formData.difficulty || 'Normal'
            }
        };
        
        if (formData.description) {
            metadata.changelog = formData.description;
        }
        
        if (formData.boxArt || formData.banner) {
            metadata.meta.images = {};
            if (formData.boxArt) metadata.meta.images.boxArt = formData.boxArt;
            if (formData.banner) metadata.meta.images.banner = formData.banner;
        }
        
        if (formData.website || formData.discord || formData.documentation) {
            metadata.meta.links = {};
            if (formData.website) metadata.meta.links.website = formData.website;
            if (formData.discord) metadata.meta.links.discord = formData.discord;
            if (formData.documentation) metadata.meta.links.documentation = formData.documentation;
        }
        
        return metadata;
    }
    
    generateId(title, baseRom) {
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        return `${baseRom.toLowerCase()}-${slug}`;
    }
    
    sanitizeFilename(filename) {
        return filename.replace(/[^a-zA-Z0-9-_]/g, '_');
    }
    
    getPatchExtension(formData) {
        if (formData.patchFile) {
            const name = formData.patchFile.name;
            const ext = name.split('.').pop().toLowerCase();
            return ['ips', 'bps', 'ups', 'xdelta'].includes(ext) ? ext : 'bps';
        }
        if (formData.patchUrl) {
            const ext = formData.patchUrl.split('.').pop().toLowerCase();
            return ['ips', 'bps', 'ups', 'xdelta'].includes(ext) ? ext : 'bps';
        }
        return 'bps';
    }
    
    generateMarkdown(formData) {
        let md = `# ${formData.title}\n\n`;
        md += `**Author:** ${formData.author}\n`;
        if (formData.version) md += `**Version:** ${formData.version}\n`;
        md += `**Base ROM:** ${formData.baseRom}\n`;
        if (formData.difficulty) md += `**Difficulty:** ${formData.difficulty}\n`;
        if (formData.status) md += `**Status:** ${formData.status}\n`;
        md += `\n## Description\n\n${formData.description || 'No description provided.'}\n`;
        
        if (formData.website || formData.discord || formData.documentation) {
            md += `\n## Links\n\n`;
            if (formData.website) md += `- [Website](${formData.website})\n`;
            if (formData.discord) md += `- [Discord](${formData.discord})\n`;
            if (formData.documentation) md += `- [Documentation](${formData.documentation})\n`;
        }
        
        return md;
    }
    
    generatePRDescription(formData, metadata) {
        return `## ROM Hack Submission

**Title:** ${formData.title}
**Author:** ${formData.author}
**Base ROM:** ${formData.baseRom}
**Version:** ${formData.version || '1.0'}

### Description
${formData.description || 'No description provided.'}

### Metadata
\`\`\`json
${JSON.stringify(metadata, null, 2)}
\`\`\`

---
*This PR was automatically generated via the ROM Patcher submission form.*`;
    }
}
