# Requirements Document

## Introduction

Enhance the individual ROM hack detail view in UROMM to provide richer, Hackdex-inspired presentation. The current implementation uses a slide-out detail panel (`docs/assets/css/components/detail-panel.css`) rendered by `UIManager.renderDetailPanel` (`docs/assets/js/modules/ui.js:176`) with banner image, markdown description, metadata table, badges, and a patch redirect button. This spec adds a screenshot gallery, version history, author profiles, related hacks, organized metadata sections, a dedicated full-page hack view, quick stats, and share/bookmark functionality.

## Glossary

- **Detail_Panel**: The existing slide-out panel (`detail-panel.css`, `UIManager.renderDetailPanel`) that displays hack information from the library grid
- **Hack_Page**: A new dedicated full-page view for a single ROM hack, accessible via direct URL
- **Gallery**: A screenshot carousel/lightbox component for viewing multiple hack images
- **Quick_Stats_Bar**: A compact horizontal bar displaying at-a-glance numeric and categorical hack information
- **Version_Timeline**: A chronological display of hack version entries with per-version changelogs
- **Author_Section**: A UI region displaying author name, links to their other hacks in the library, and external social/community profiles
- **Related_Hacks**: A section showing other hacks sharing the same base ROM or overlapping tags
- **Bookmark_Manager**: A client-side module that persists user bookmarks in localStorage
- **Share_URL**: A URL containing query parameters or hash fragments that deep-link to a specific hack view
- **Manifest**: The auto-generated `docs/manifest.json` catalog of all patches and metadata
- **Metadata_Section**: An organized grouping of hack metadata fields into logical categories (features, mechanics, compatibility)
- **Lightbox**: A full-screen overlay for viewing images at full resolution with navigation controls

## Requirements

### Requirement 1: Screenshot Gallery

**User Story:** As a user browsing ROM hacks, I want to view multiple screenshots of a hack in a gallery with lightbox navigation, so that I can preview the hack's visuals before patching.

#### Acceptance Criteria

1. WHEN a hack entry in the Manifest contains an images array with more than one image URL, THE Gallery SHALL render a thumbnail strip below the banner in both the Detail_Panel and Hack_Page.
2. WHEN a user clicks a thumbnail in the Gallery, THE Lightbox SHALL open displaying the selected image at full resolution with a dark overlay background.
3. WHILE the Lightbox is open, THE Gallery SHALL display navigation arrows allowing the user to move to the next or previous image in the array.
4. WHILE the Lightbox is open, THE Gallery SHALL display the current image index and total count (e.g., "2 / 5").
5. WHEN a user presses the Escape key or clicks the overlay background while the Lightbox is open, THE Lightbox SHALL close and return focus to the thumbnail that was clicked.
6. WHILE the Lightbox is open, THE Gallery SHALL support left and right arrow keyboard navigation to move between images.
7. WHEN a hack entry contains zero or one image, THE Gallery SHALL not render the thumbnail strip.
8. THE Gallery SHALL lazy-load thumbnail images using the `loading="lazy"` attribute to avoid blocking initial page render.
9. IF an image URL fails to load, THEN THE Gallery SHALL display a placeholder icon and skip that image in Lightbox navigation without breaking the sequence.

### Requirement 2: Version History Timeline

**User Story:** As a user evaluating a ROM hack, I want to see a version history with changelogs per version, so that I can understand the hack's development progress and recent changes.

#### Acceptance Criteria

1. WHEN a hack entry in the Manifest contains a changelog with multiple version headings (e.g., `## v1.0`, `## v2.0`), THE Version_Timeline SHALL parse the changelog into separate version entries displayed in reverse chronological order.
2. THE Version_Timeline SHALL display each version entry with the version identifier, and the changelog content for that version rendered as HTML via Marked.js.
3. WHEN a changelog contains only a single version or no version headings, THE Version_Timeline SHALL display the full changelog as a single entry without timeline formatting.
4. WHEN a user clicks a version entry header in the Version_Timeline, THE Version_Timeline SHALL expand or collapse that entry's changelog content.
5. THE Version_Timeline SHALL display the most recent version entry expanded by default and all older entries collapsed.

### Requirement 3: Author Section

**User Story:** As a user discovering ROM hacks, I want to see the author's name with links to their other hacks and community profiles, so that I can explore more of their work.

#### Acceptance Criteria

1. THE Author_Section SHALL display the author name from the hack metadata prominently in both the Detail_Panel and Hack_Page.
2. WHEN the Manifest contains other hacks by the same author (matched by the `meta.author` field), THE Author_Section SHALL display a list of up to 5 other hacks by that author as clickable links.
3. WHEN a user clicks an author's other hack link, THE Hack_Page for that hack SHALL open.
4. WHEN the hack metadata contains a discord link, THE Author_Section SHALL display it as a clickable icon link.
5. WHEN the hack metadata contains a website link, THE Author_Section SHALL display it as a clickable icon link.
6. WHEN the author has no other hacks in the Manifest and no external links, THE Author_Section SHALL display only the author name without an empty links area.

### Requirement 4: Related Hacks

**User Story:** As a user viewing a ROM hack, I want to see related hacks based on the same base ROM or similar tags, so that I can discover similar hacks.

#### Acceptance Criteria

1. THE Related_Hacks section SHALL query the Manifest for hacks sharing the same `baseRom` value as the currently viewed hack, excluding the current hack.
2. THE Related_Hacks section SHALL display up to 6 related hack cards, each showing the hack title, author, base ROM badge, and box art thumbnail.
3. WHEN fewer than 3 hacks share the same base ROM, THE Related_Hacks section SHALL supplement results with hacks that share at least 2 overlapping tags from the `meta.tags` array.
4. WHEN a user clicks a related hack card, THE Hack_Page for that hack SHALL open.
5. WHEN no related hacks exist in the Manifest (no shared base ROM and no shared tags), THE Related_Hacks section SHALL not render.

### Requirement 5: Rich Metadata Display

**User Story:** As a user evaluating a ROM hack, I want metadata organized into logical sections (features, mechanics, compatibility), so that I can quickly find specific information.

#### Acceptance Criteria

1. THE Metadata_Section SHALL group metadata fields into three categories: "Features" (hackType, graphics, story, maps, postgame, fakemons, openWorld), "Mechanics" (mechanics, physicalSpecialSplit, typeChanges, variants, nuzlocke, randomizer, antiCheat), and "Compatibility" (system, baseRom, version, status, difficulty).
2. THE Metadata_Section SHALL render each category as a collapsible section with a header icon and label.
3. THE Metadata_Section SHALL display all three categories expanded by default on desktop viewports (width greater than 768px).
4. WHILE the viewport width is 768px or less, THE Metadata_Section SHALL display all three categories collapsed by default with tap-to-expand behavior.
5. WHEN a metadata field value is null, undefined, or empty, THE Metadata_Section SHALL omit that field from the rendered output.
6. THE Metadata_Section SHALL render array-type fields (mechanics, tags, typeChanges, variants) as inline badge-style chips.
7. THE Metadata_Section SHALL render boolean fields (physicalSpecialSplit, antiCheat, openWorld) as "Yes" or "No" with a corresponding color indicator (green for Yes, neutral for No).

### Requirement 6: Dedicated Hack Page

**User Story:** As a user, I want a full-page view for a ROM hack that I can access via a direct URL, so that I can see all hack details without the constraints of a slide-out panel.

#### Acceptance Criteria

1. THE Hack_Page SHALL be accessible at the URL path `docs/library/index.html?hack={hackId}` where `{hackId}` matches the hack's `id` field in the Manifest.
2. WHEN the library page loads with a `hack` query parameter, THE Hack_Page SHALL render a full-page layout replacing the library grid view, displaying all hack detail sections (banner, Gallery, Quick_Stats_Bar, description, Metadata_Section, Version_Timeline, Author_Section, Related_Hacks, and links).
3. THE Hack_Page SHALL include a back navigation element that returns the user to the library grid view, preserving any active search or filter state via the StateManager.
4. THE Hack_Page SHALL include a "Patch This ROM" button that navigates to the patcher page (`docs/patcher/index.html`) with the hack's patch file pre-selected via URL parameters.
5. WHEN a user clicks a hack card in the library grid, THE Detail_Panel SHALL continue to open as the default behavior (existing functionality preserved).
6. THE Detail_Panel SHALL include a "View Full Page" link that navigates to the Hack_Page URL for the currently displayed hack.
7. WHEN the `hack` query parameter references an ID not found in the Manifest, THE Hack_Page SHALL display a "Hack not found" message with a link back to the library.
8. THE Hack_Page SHALL render correctly on viewports from 320px to 2560px wide, using responsive CSS with breakpoints consistent with existing detail panel media queries (768px, 480px).

### Requirement 7: Quick Stats Bar

**User Story:** As a user, I want to see at-a-glance stats like playtime, catchable Pokemon count, and Pokedex range, so that I can quickly assess a hack's scope.

#### Acceptance Criteria

1. THE Quick_Stats_Bar SHALL display available stats from the hack metadata: playtime, totalCatchable, pokedexIncludes, difficulty, and rating.
2. THE Quick_Stats_Bar SHALL render as a horizontal row of stat items, each with a Lucide icon, a label, and the value.
3. WHEN a stat field is null or undefined in the hack metadata, THE Quick_Stats_Bar SHALL omit that stat item from the rendered output.
4. THE Quick_Stats_Bar SHALL render the rating value as a star display (filled and empty stars out of 5).
5. THE Quick_Stats_Bar SHALL appear below the banner and above the tabbed content in both the Detail_Panel and Hack_Page.
6. WHILE the viewport width is 480px or less, THE Quick_Stats_Bar SHALL wrap stat items into a 2-column grid layout.

### Requirement 8: Share and Bookmark Functionality

**User Story:** As a user, I want to share a link to a specific hack and bookmark hacks for later, so that I can easily return to or share hacks I find interesting.

#### Acceptance Criteria

1. THE Hack_Page and Detail_Panel SHALL each include a share button that copies the Hack_Page URL (with `hack` query parameter) to the clipboard.
2. WHEN a user clicks the share button, THE system SHALL copy the Share_URL to the clipboard and display a brief confirmation tooltip (e.g., "Link copied").
3. THE Hack_Page and Detail_Panel SHALL each include a bookmark toggle button.
4. WHEN a user clicks the bookmark toggle, THE Bookmark_Manager SHALL add or remove the hack's ID from the bookmarks list stored in localStorage under the key `uromm_bookmarks`.
5. WHEN a hack is bookmarked, THE bookmark toggle button SHALL display a filled bookmark icon. WHEN a hack is not bookmarked, THE bookmark toggle button SHALL display an outlined bookmark icon.
6. THE library grid SHALL indicate bookmarked hacks with a small bookmark icon overlay on the hack card.
7. WHEN the library page loads, THE Bookmark_Manager SHALL read the bookmarks list from localStorage and apply bookmark indicators to matching hack cards in the grid.
8. IF the Clipboard API is unavailable (e.g., non-HTTPS context), THEN THE share button SHALL fall back to selecting the URL text in a temporary input field for manual copying.
