# ROM Patcher

A dedicated ROM patching interface that allows users to search for and apply patches directly.

## Features

- **Search-based patch selection**: Scalable search through all available patches
- **Creator mode**: Bypass checksum validation for testing and development
- **Real-time validation**: Automatic ROM validation with visual feedback
- **Consistent styling**: Matches the main application theme
- **Responsive design**: Works on all device sizes

## Usage

1. Search for patches using the search bar
2. Select a patch from the results
3. Upload your ROM file
4. Apply the patch

## Creator Mode

Toggle creator mode to bypass checksum validation. This is useful for:

- Testing patches during development
- Working with modified ROMs
- Experimental patching

## File Structure

```text
patcher/
├── index.html          # Main patcher interface
├── js/
│   └── patcher-app.js  # Main application logic
└── README.md           # This file
```
