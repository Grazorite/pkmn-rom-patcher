// GitHub API Service
export class GitHubAPI {
    constructor(token, repo = 'Grazorite/pkmn-rom-patcher') {
        this.token = token;
        this.repo = repo;
        this.baseUrl = 'https://api.github.com';
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `GitHub API error: ${response.status}`);
        }
        
        return response.json();
    }
    
    async getUser() {
        return this.request('/user');
    }
    
    async forkRepo() {
        try {
            const [owner, repoName] = this.repo.split('/');
            return await this.request(`/repos/${owner}/${repoName}/forks`, {
                method: 'POST'
            });
        } catch (error) {
            if (error.message.includes('already exists')) {
                const user = await this.getUser();
                const [, repoName] = this.repo.split('/');
                return this.request(`/repos/${user.login}/${repoName}`);
            }
            throw error;
        }
    }
    
    async getDefaultBranch(owner, repo) {
        const repoData = await this.request(`/repos/${owner}/${repo}`);
        return repoData.default_branch;
    }
    
    async getRef(owner, repo, ref) {
        return this.request(`/repos/${owner}/${repo}/git/ref/${ref}`);
    }
    
    async createBranch(owner, repo, branchName, fromSha) {
        return this.request(`/repos/${owner}/${repo}/git/refs`, {
            method: 'POST',
            body: JSON.stringify({
                ref: `refs/heads/${branchName}`,
                sha: fromSha
            })
        });
    }
    
    async createOrUpdateFile(owner, repo, path, content, message, branch, sha = null) {
        const body = {
            message,
            content: btoa(unescape(encodeURIComponent(content))),
            branch
        };
        
        if (sha) {
            body.sha = sha;
        }
        
        return this.request(`/repos/${owner}/${repo}/contents/${path}`, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }
    
    async uploadBinaryFile(owner, repo, path, fileContent, message, branch) {
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
            reader.onload = async () => {
                try {
                    const base64Content = reader.result.split(',')[1];
                    const result = await this.request(`/repos/${owner}/${repo}/contents/${path}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            message,
                            content: base64Content,
                            branch
                        })
                    });
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(fileContent);
        });
    }
    
    async createPullRequest(owner, repo, title, body, head, base) {
        return this.request(`/repos/${owner}/${repo}/pulls`, {
            method: 'POST',
            body: JSON.stringify({
                title,
                body,
                head,
                base
            })
        });
    }
}
