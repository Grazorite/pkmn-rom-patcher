# Workflow Optimization

## Overview

The GitHub Actions workflows have been optimized to prevent unnecessary validation runs for development PRs while maintaining robust validation for ROM hack submissions.

## PR Type Detection

The `scripts/pr-analyzer.js` script automatically detects PR types based on:

### Submission PRs

- Contains community submission template text
- Adds new patch files (`patches/**/*.{ips,bps,ups,xdelta}`)
- Adds new metadata files (`metadata/**/*.json`)

### Development PRs

- Modifies scripts, workflows, or documentation
- Changes files in: `scripts/`, `.github/`, `docs/assets/`, `tests/`
- No new patch or metadata files

### Mixed PRs

- Contains both submission and development changes
- Validation runs for submission-related changes only

## Workflow Behavior

### `validate-submission.yml`

- **Triggers**: PRs touching `metadata/**` or `patches/**`
- **Validation**: Only runs for submission PRs
- **Comments**: Only posts validation results for submissions

### `validate-naming.yml`

- **Triggers**: PRs touching `metadata/**` or `patches/**`
- **Validation**: Only runs for submission PRs
- **Comments**: Only posts naming validation for submissions

### `pr-info.yml`

- **Triggers**: PRs touching various development paths
- **Purpose**: Informs users when validation is skipped
- **Comments**: Posts informational message for development PRs

## Benefits

1. **Reduced CI overhead** - No unnecessary validation runs
2. **Cleaner PR experience** - No confusing validation comments on development PRs
3. **Maintained security** - Full validation still runs for actual submissions
4. **Clear communication** - Users understand why validation was skipped

## Manual Override

If validation needs to run on a development PR, add this to the PR description:

```text
Force validation: true
```

The PR analyzer will detect this and run validation regardless of file changes.
