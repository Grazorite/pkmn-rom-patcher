# Requirements Document

## Introduction

Enhance the UROMM ROM Library page with a Hackdex-inspired curated browsing experience. The current library provides a searchable grid of ROM hacks with sidebar checkbox filters, a card/grid view toggle, and a slide-out detail panel. This feature improves visual hierarchy, discoverability, and filtering UX by introducing curated sections, tag-based navigation, richer card layouts, sort controls, and system-colored accents — all within the existing vanilla JS, static-site architecture.

## Glossary

- **Library_Page**: The ROM hack browsing page at `docs/library/index.html`, powered by `ROMLibraryApp`, `UIManager`, and `SearchManager`
- **Card**: A clickable UI element in the hack grid representing a single ROM hack, rendered by `UIManager.createHackCard()`
- **Curated_Section**: A horizontal, labeled row of cards at the top of the Library_Page highlighting a specific collection (e.g., recently updated, featured)
- **Tag_Chip**: A clickable pill-shaped UI element representing a tag, system, or category that applies a filter when clicked
- **Filter_Bar**: A horizontal strip of Tag_Chips displayed above the hack grid, replacing or supplementing the sidebar checkbox filters
- **Sort_Control**: A dropdown or button group allowing users to reorder the hack grid by a chosen criterion
- **System_Accent**: A color derived from `config/systems.json` applied to card borders or visual elements to indicate the hack's gaming system
- **Version_Badge**: A badge displayed on a Card showing the hack's version string (from `meta.version`)
- **Status_Badge**: A badge displayed on a Card showing the hack's completion status (from `meta.status`)
- **Summary_Text**: A short description excerpt displayed on a Card, derived from the hack's changelog or description
- **Manifest**: The auto-generated `docs/manifest.json` file containing all hack data, loaded at runtime by `ManifestLoader`
- **Detail_Panel**: The existing slide-out panel showing full hack information when a Card is clicked

## Requirements

### Requirement 1: Enhanced Card Layout with Cover Art

**User Story:** As a user browsing the library, I want cards to prominently display cover art with overlaid metadata, so that I can visually identify hacks at a glance.

#### Acceptance Criteria

1. THE Card SHALL display the hack's `boxArt` image as the primary visual element, filling the card image area
2. WHEN a hack has no `boxArt` image, THE Card SHALL fall back to the `banner` image, then to a styled placeholder with the hack title
3. THE Card SHALL display the hack title, author name, and Summary_Text below the image area
4. THE Summary_Text SHALL display a maximum of 2 lines of text with ellipsis truncation for overflow
5. THE Card SHALL display Version_Badge and Status_Badge in the card content area alongside existing ROM, system, and difficulty badges
6. WHEN the viewport width is 480px or less, THE Card SHALL reduce the image height and font sizes to maintain readability on mobile devices

### Requirement 2: System-Colored Card Accents

**User Story:** As a user, I want cards to have visual accents based on the hack's gaming system, so that I can quickly distinguish hacks by platform.

#### Acceptance Criteria

1. WHEN a Card is rendered, THE Library_Page SHALL apply the system's `primary` color from `config/systems.json` as a left border accent on the Card
2. WHEN a Card is hovered, THE Library_Page SHALL intensify the System_Accent by applying the system's `primary` color as a subtle box-shadow glow
3. IF the system color data is unavailable, THEN THE Library_Page SHALL fall back to the default accent color (`--accent` CSS variable)
4. THE System_Accent SHALL be applied using inline CSS custom properties (e.g., `--card-system-color`) set per card, consumed by the card's CSS rules

### Requirement 3: Tag-Based Navigation with Filter Bar

**User Story:** As a user, I want to click on tags to filter the library, so that I can quickly narrow results without opening sidebar filter groups.

#### Acceptance Criteria

1. THE Library_Page SHALL display a Filter_Bar above the hack grid containing Tag_Chips for the most common tags, systems, and statuses
2. WHEN a user clicks a Tag_Chip, THE Library_Page SHALL toggle the corresponding filter in `SearchManager.activeFilters` and re-render the hack grid
3. WHEN a filter is active, THE corresponding Tag_Chip SHALL display a visually distinct selected state (filled background with contrasting text)
4. THE Filter_Bar SHALL be horizontally scrollable on mobile viewports to accommodate all Tag_Chips without wrapping to multiple rows
5. WHEN a user clicks a badge on a Card (e.g., a system badge or tag badge), THE Library_Page SHALL activate the corresponding filter as if the user clicked the equivalent Tag_Chip
6. THE Filter_Bar SHALL display a count of active filters and a "Clear all" button when one or more filters are active

### Requirement 4: Curated Sections

**User Story:** As a user, I want to see featured and recently updated hacks highlighted at the top of the library, so that I can discover new and noteworthy content.

#### Acceptance Criteria

1. THE Library_Page SHALL display a "Recently Updated" Curated_Section above the main hack grid, showing hacks sorted by `meta.released` date in descending order
2. THE Library_Page SHALL display a "Top Rated" Curated_Section above the main hack grid, showing hacks sorted by `meta.rating` in descending order
3. EACH Curated_Section SHALL display a maximum of 8 hacks in a horizontally scrollable row
4. WHEN a user clicks a Card in a Curated_Section, THE Library_Page SHALL open the Detail_Panel for that hack
5. EACH Curated_Section SHALL include a "View All" link that applies the corresponding sort to the main hack grid and scrolls to the grid
6. WHEN search text is entered or filters are active, THE Library_Page SHALL hide the Curated_Sections to show only filtered results
7. WHEN all filters and search text are cleared, THE Library_Page SHALL re-display the Curated_Sections

### Requirement 5: Sort Controls

**User Story:** As a user, I want to sort the hack grid by different criteria, so that I can find hacks based on my preferences.

#### Acceptance Criteria

1. THE Library_Page SHALL display a Sort_Control in the results header area alongside the existing view toggle and clear filters buttons
2. THE Sort_Control SHALL offer the following sort options: "Recently Updated" (by `meta.released` descending), "Top Rated" (by `meta.rating` descending), "Title A-Z" (alphabetical by `title`), "Title Z-A" (reverse alphabetical), and "System" (grouped by `meta.system`)
3. WHEN a user selects a sort option, THE Library_Page SHALL reorder the hack grid according to the selected criterion
4. THE Library_Page SHALL default to "Recently Updated" sort order on initial page load
5. WHEN the user navigates away and returns to the Library_Page, THE Library_Page SHALL restore the previously selected sort option from session state

### Requirement 6: Improved Filter UX

**User Story:** As a user, I want a more intuitive filtering experience, so that I can efficiently narrow down the hack library.

#### Acceptance Criteria

1. THE sidebar filter groups SHALL display the count of matching hacks next to each filter option (e.g., "GBA (12)")
2. WHEN a filter is active, THE sidebar filter group header SHALL display a badge showing the number of active selections in that group
3. THE Library_Page SHALL display active filters as removable Tag_Chips in the Filter_Bar, each with a close icon to deactivate that specific filter
4. WHEN a user removes a Tag_Chip from the Filter_Bar, THE Library_Page SHALL deactivate the corresponding filter and update the sidebar checkbox state
5. THE sidebar filter groups SHALL remain collapsed by default but auto-expand when a filter within the group is active
6. WHEN the viewport width is 768px or less, THE Library_Page SHALL present filters via the existing mobile filter sheet instead of the sidebar

### Requirement 7: Hack Summary on Cards

**User Story:** As a user, I want to see a brief description of each hack on its card, so that I can evaluate hacks without opening the detail panel.

#### Acceptance Criteria

1. THE Card SHALL extract Summary_Text from the hack's `changelog` field by taking the first paragraph after the "Overview" heading
2. IF the hack has no `changelog` field or no "Overview" section, THEN THE Card SHALL display no Summary_Text (the area remains empty)
3. THE Summary_Text SHALL be rendered as plain text with HTML tags and markdown syntax stripped
4. THE Summary_Text SHALL be truncated to a maximum of 120 characters, appending an ellipsis if truncated
5. WHEN the Card is in grid view mode (compact), THE Card SHALL hide the Summary_Text to preserve the compact layout

### Requirement 8: Responsive Layout Adaptation

**User Story:** As a user on a mobile device, I want the enhanced library features to work well on small screens, so that I can browse comfortably on any device.

#### Acceptance Criteria

1. WHEN the viewport width is 768px or less, THE Curated_Sections SHALL display cards in a horizontally scrollable row with touch-friendly scroll behavior (CSS `scroll-snap-type`)
2. WHEN the viewport width is 768px or less, THE Filter_Bar SHALL be horizontally scrollable with momentum scrolling enabled
3. WHEN the viewport width is 480px or less, THE Card SHALL stack the image and content vertically with reduced padding
4. THE Library_Page SHALL respect the `prefers-reduced-motion` media query by disabling hover animations and scroll-snap transitions
5. WHEN the viewport width is 768px or less, THE Sort_Control SHALL render as a compact dropdown instead of a button group
