const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Analyzes PR to determine if it's a ROM hack submission or development change
 */
function analyzePR() {
  try {
    // Get changed files in the PR
    let changedFiles;
    try {
      changedFiles = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' })
        .split('\n')
        .filter(file => file.trim());
    } catch (error) {
      // Fallback for testing or when git history is not available
      changedFiles = [];
    }

    // Check if PR uses community submission template or manual override
    const prBody = process.env.PR_BODY || '';
    const isSubmissionTemplate = prBody.includes('Submitted via ROM Patcher submission form') ||
                                prBody.includes('ROM Hack Submission');
    const forceValidation = prBody.includes('Force validation: true');

    // Analyze file changes
    const analysis = {
      addedPatches: [],
      addedMetadata: [],
      modifiedExisting: [],
      developmentFiles: []
    };

    for (const file of changedFiles) {
      if (file.startsWith('patches/') && file.match(/\.(ips|bps|ups|xdelta)$/)) {
        // Check if file is new (added) or modified
        try {
          execSync(`git cat-file -e HEAD~1:${file}`, { stdio: 'ignore' });
          analysis.modifiedExisting.push(file);
        } catch {
          analysis.addedPatches.push(file);
        }
      } else if (file.startsWith('metadata/') && file.endsWith('.json')) {
        try {
          execSync(`git cat-file -e HEAD~1:${file}`, { stdio: 'ignore' });
          analysis.modifiedExisting.push(file);
        } catch {
          analysis.addedMetadata.push(file);
        }
      } else if (file.startsWith('scripts/') || file.startsWith('.github/') || 
                 file.startsWith('docs/assets/') || file.startsWith('tests/')) {
        analysis.developmentFiles.push(file);
      }
    }

    // Determine PR type
    const isSubmission = isSubmissionTemplate || 
                        (analysis.addedPatches.length > 0 && analysis.addedMetadata.length > 0);
    
    const isDevelopment = analysis.developmentFiles.length > 0 && 
                         analysis.addedPatches.length === 0 && 
                         analysis.addedMetadata.length === 0;

    const result = {
      type: isSubmission ? 'submission' : (isDevelopment ? 'development' : 'mixed'),
      isSubmission,
      isDevelopment,
      forceValidation,
      analysis,
      shouldValidate: forceValidation || isSubmission || (!isDevelopment && analysis.modifiedExisting.some(f => 
        f.startsWith('patches/') || f.startsWith('metadata/')
      ))
    };

    console.log(JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    console.error('Error analyzing PR:', error.message);
    // Default to validation on error
    return { type: 'unknown', isSubmission: true, shouldValidate: true };
  }
}

// Export for GitHub Actions
if (require.main === module) {
  const result = analyzePR();
  
  // Set GitHub Actions outputs
  if (process.env.GITHUB_OUTPUT) {
    const outputs = [
      `pr_type=${result.type}`,
      `is_submission=${result.isSubmission}`,
      `is_development=${result.isDevelopment}`,
      `force_validation=${result.forceValidation}`,
      `should_validate=${result.shouldValidate}`
    ];
    
    fs.appendFileSync(process.env.GITHUB_OUTPUT, outputs.join('\n') + '\n');
  }
}

module.exports = { analyzePR };