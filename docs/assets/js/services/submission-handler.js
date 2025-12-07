// Submission Handler
import { GitHubAuth } from './github-auth.js';
import { GitHubAPI } from './github-api.js';
import { MetadataGenerator } from './metadata-generator.js';

export class SubmissionHandler {
    constructor() {
        this.auth = new GitHubAuth();
        this.metadataGen = new MetadataGenerator();
        this.progressCallback = null;
    }
    
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }
    
    updateProgress(message, percent) {
        if (this.progressCallback) {
            this.progressCallback(message, percent);
        }
    }
    
    async submit(formData) {
        try {
            this.updateProgress('Authenticating with GitHub...', 10);
            
            let token = this.auth.getToken();
            if (!token) {
                token = await this.auth.promptForToken();
                if (!token) {
                    throw new Error('Authentication cancelled');
                }
            }
            
            const api = new GitHubAPI(token);
            const user = await api.getUser();
            
            this.updateProgress('Forking repository...', 20);
            const fork = await api.forkRepo();
            await this.waitForFork(api, user.login, fork.name);
            
            this.updateProgress('Creating branch...', 40);
            const branchName = `submission/${this.metadataGen.generateId(formData.title, formData.baseRom)}`;
            const defaultBranch = await api.getDefaultBranch(user.login, fork.name);
            const ref = await api.getRef(user.login, fork.name, `heads/${defaultBranch}`);
            
            try {
                await api.createBranch(user.login, fork.name, branchName, ref.object.sha);
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    throw error;
                }
            }
            
            this.updateProgress('Generating metadata...', 50);
            const metadata = this.metadataGen.generate(formData);
            const metadataJson = JSON.stringify(metadata, null, 2);
            
            this.updateProgress('Uploading metadata file...', 60);
            const metadataPath = `metadata/${formData.baseRom.toLowerCase()}/${this.metadataGen.sanitizeFilename(formData.title)}.json`;
            await api.createOrUpdateFile(
                user.login,
                fork.name,
                metadataPath,
                metadataJson,
                `Add ${formData.title} metadata`,
                branchName
            );
            
            if (formData.patchFile) {
                this.updateProgress('Uploading patch file...', 70);
                const patchPath = `patches/${formData.baseRom.toLowerCase()}/${this.metadataGen.sanitizeFilename(formData.title)}.${this.metadataGen.getPatchExtension(formData)}`;
                await api.uploadBinaryFile(
                    user.login,
                    fork.name,
                    patchPath,
                    formData.patchFile,
                    `Add ${formData.title} patch file`,
                    branchName
                );
            }
            
            this.updateProgress('Creating pull request...', 85);
            const [owner, repo] = 'Grazorite/pkmn-rom-patcher'.split('/');
            const pr = await api.createPullRequest(
                owner,
                repo,
                `Add ${formData.title}`,
                this.metadataGen.generatePRDescription(formData, metadata),
                `${user.login}:${branchName}`,
                'main'
            );
            
            this.updateProgress('Submission complete!', 100);
            
            return {
                success: true,
                prUrl: pr.html_url,
                prNumber: pr.number
            };
            
        } catch (error) {
            console.error('Submission error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async waitForFork(api, owner, repo, maxAttempts = 10) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                await api.request(`/repos/${owner}/${repo}`);
                return;
            } catch (error) {
                if (i === maxAttempts - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
}
