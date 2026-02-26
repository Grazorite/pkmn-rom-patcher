# Requirements Document

## Introduction

Enhance the UROMM community submission form (`docs/submit/index.html`) with Hackdex-inspired improvements. The current form is a 4-step wizard (Basic Info → Details → Assets & Files → Review) that collects hack metadata, patch files, and image URLs, then authenticates via GitHub PAT to auto-fork the repo, create a branch, upload files, and open a PR. This feature enriches the submission experience with screenshot/cover image uploads, social links, version management, richer metadata, a live library preview, inline validation, improved progress indication, and local draft saving — all within the existing vanilla JS, static-site, client-side architecture.

## Glossary

- **Submit_Form**: The multi-step wizard form at `docs/submit/index.html`, powered by the `SubmitForm` class in `docs/assets/js/modules/submit-form.js`
- **Wizard_Step**: One of the sequential form sections (currently steps 1–4) that the user navigates through via Previous/Next buttons
- **Progress_Indicator**: The visual step tracker at the top of the Submit_Form showing which Wizard_Step is active and which are completed
- **Form_Renderer**: The utility module (`docs/assets/js/utils/form-renderer.js`) that generates HTML form fields from `METADATA_FIELDS` config
- **Metadata_Generator**: The service (`docs/assets/js/services/metadata-generator.js`) that builds the metadata JSON object from form data
- **Submission_Handler**: The service (`docs/assets/js/services/submission-handler.js`) that orchestrates the GitHub fork → branch → upload → PR flow
- **GitHub_API**: The service (`docs/assets/js/services/github-api.js`) providing methods for GitHub REST API operations including `uploadBinaryFile`
- **Library_Card**: The card component used in the ROM Library page to display a hack's cover art, title, badges, and summary
- **Live_Preview**: A real-time rendering of how the hack will appear as a Library_Card, updated as the user fills out the form
- **Draft**: A locally persisted snapshot of the user's in-progress form data, stored in `localStorage`
- **Image_Upload**: A form control that accepts image files (PNG, JPG, WebP) for cover art or screenshots, to be committed to the repo via GitHub_API
- **Inline_Validation**: Real-time field-level validation feedback displayed adjacent to form fields as the user types or changes values
- **Social_Links**: A group of URL fields for the hack author's Discord server, website, documentation, and social media profiles

## Requirements

### Requirement 1: Screenshot and Cover Image Upload

**User Story:** As a hack submitter, I want to upload cover art and screenshots directly through the form, so that my hack has visual assets in the library without needing to host images externally.

#### Acceptance Criteria

1. THE Submit_Form SHALL provide an image upload control for cover art (box art) that accepts PNG, JPG, and WebP files up to 2MB
2. THE Submit_Form SHALL provide an image upload control for banner image that accepts PNG, JPG, and WebP files up to 2MB
3. THE Submit_Form SHALL provide an image upload control for up to 4 additional screenshots that each accept PNG, JPG, and WebP files up to 2MB
4. WHEN a user uploads an image file, THE Submit_Form SHALL display a thumbnail preview of the uploaded image adjacent to the upload control
5. WHEN a user provides an external URL instead of uploading a file, THE Submit_Form SHALL display a thumbnail preview by loading the URL as an image source
6. THE Submit_Form SHALL retain the existing URL input fields for box art and banner as an alternative to file upload
7. WHEN a user has provided both a file upload and a URL for the same image slot, THE Submit_Form SHALL prioritize the file upload over the URL
8. WHEN the submission is processed, THE Submission_Handler SHALL upload image files to the repository via GitHub_API `uploadBinaryFile` at the path `metadata/{baseRom}/images/{hackId}/`
9. WHEN the submission is processed, THE Metadata_Generator SHALL include uploaded image paths as relative repository URLs in the metadata JSON `meta.images` object
10. IF an uploaded image file exceeds 2MB, THEN THE Submit_Form SHALL display an error message on the upload control and prevent form progression

### Requirement 2: Social Links Section

**User Story:** As a hack submitter, I want to provide social and community links for my hack, so that players can find my Discord server, website, and other resources.

#### Acceptance Criteria

1. THE Submit_Form SHALL provide URL input fields for: website, Discord invite link, documentation link, and author social profile link
2. EACH social link field SHALL display a recognizable icon (globe for website, message-circle for Discord, book for documentation, user for social profile) using Lucide icons
3. WHEN a user enters a URL in a social link field, THE Submit_Form SHALL validate that the value is a well-formed URL
4. THE social link fields SHALL all be optional (not required for form submission)
5. WHEN the submission is processed, THE Metadata_Generator SHALL include provided social links in the metadata JSON `meta.links` object, omitting empty fields

### Requirement 3: Version Management

**User Story:** As a hack submitter, I want clear version formatting guidance and the ability to indicate updates to existing hacks, so that the library accurately tracks hack versions.

#### Acceptance Criteria

1. THE Submit_Form SHALL display the version field with placeholder text showing the expected format (e.g., "1.0.0" or "v2.3")
2. THE Submit_Form SHALL display a help text below the version field explaining the recommended semantic versioning format
3. THE Submit_Form SHALL provide a checkbox labeled "This is an update to an existing hack" on the Basic Info step
4. WHEN the "update to existing hack" checkbox is checked, THE Submit_Form SHALL display a searchable dropdown listing existing hacks from the manifest, filtered by the selected base ROM
5. WHEN the user selects an existing hack from the dropdown, THE Submit_Form SHALL pre-populate the title, author, and base ROM fields with the existing hack's values
6. WHEN the submission is processed for an update, THE Metadata_Generator SHALL include an `updateOf` field in the metadata JSON referencing the existing hack's ID
7. IF the version field is left empty, THEN THE Metadata_Generator SHALL default the version to "1.0" in the generated metadata

### Requirement 4: Richer Metadata Collection

**User Story:** As a hack submitter, I want to provide detailed metadata about my hack's features and content, so that users can make informed decisions when browsing the library.

#### Acceptance Criteria

1. THE Submit_Form SHALL collect hack type via a select field with options defined in `METADATA_FIELDS.hackType` (currently "New" and "Improvement")
2. THE Submit_Form SHALL collect a features list via multi-checkbox fields for mechanics, variants, type changes, and tags as defined in `METADATA_FIELDS`
3. THE Submit_Form SHALL collect postgame information via a select field with options "Yes", "No", and "N/A" as defined in `METADATA_FIELDS.postgame`
4. THE Submit_Form SHALL collect difficulty details via a select field with options defined in `METADATA_FIELDS.difficulty`
5. THE Submit_Form SHALL collect total catchable Pokemon count via a numeric input field as defined in `METADATA_FIELDS.totalCatchable`
6. THE Submit_Form SHALL collect Pokedex generation range via a select field as defined in `METADATA_FIELDS.pokedexIncludes`
7. EACH metadata field that has an `optionTooltips` property in `METADATA_FIELDS` SHALL display tooltip text when the user hovers over or focuses on that option
8. THE Form_Renderer SHALL generate all detail fields from the `METADATA_FIELDS` configuration and `STEP_LAYOUTS` without hardcoding field definitions in HTML

### Requirement 5: Live Library Preview

**User Story:** As a hack submitter, I want to see a real-time preview of how my hack will appear in the library, so that I can verify my submission looks correct before submitting.

#### Acceptance Criteria

1. THE Submit_Form SHALL display a Live_Preview panel on the Review step (step 4) that renders the hack as a Library_Card using the same visual styling as the ROM Library page
2. WHEN the user changes any form field value, THE Live_Preview SHALL update within 300ms to reflect the current form data
3. THE Live_Preview SHALL display the hack title, author, base ROM badge, system badge, difficulty badge, status badge, and version badge using the same badge styling as the Library_Card
4. WHEN a cover art image has been uploaded or a box art URL has been provided, THE Live_Preview SHALL display the image as the card's primary visual
5. WHEN no cover art is available, THE Live_Preview SHALL display a styled placeholder with the hack title, matching the Library_Card fallback behavior
6. THE Live_Preview SHALL display the description text truncated to 2 lines with ellipsis, matching the Library_Card summary behavior
7. WHEN the viewport width is 768px or less, THE Live_Preview SHALL render below the form fields in a stacked layout instead of side-by-side

### Requirement 6: Inline Validation with Field-Level Feedback

**User Story:** As a hack submitter, I want immediate feedback when I fill out fields incorrectly, so that I can fix errors before trying to advance to the next step.

#### Acceptance Criteria

1. WHEN a user leaves a required field empty and moves focus away from the field, THE Submit_Form SHALL display an error message below the field indicating the field is required
2. WHEN a user enters an invalid URL in a URL field and moves focus away, THE Submit_Form SHALL display an error message indicating the URL format is invalid
3. WHEN a user enters a value that satisfies the field's validation rules, THE Submit_Form SHALL remove any previously displayed error message for that field
4. WHEN a user attempts to advance to the next Wizard_Step, THE Submit_Form SHALL validate all required fields in the current step and display error messages for all invalid fields simultaneously
5. THE Submit_Form SHALL visually distinguish invalid fields with a red border color using the `--error` CSS custom property
6. THE Submit_Form SHALL visually distinguish valid fields that have been touched with a green border color using the `--success` CSS custom property
7. EACH form field SHALL display a help text hint below the input describing the expected format or purpose, using the existing `form-hint` CSS class
8. IF a patch file exceeds 10MB, THEN THE Submit_Form SHALL display an error message on the file input indicating the maximum file size

### Requirement 7: Enhanced Wizard Progress Indicator

**User Story:** As a hack submitter, I want a clear visual indicator of my progress through the form, so that I know how many steps remain and which steps are complete.

#### Acceptance Criteria

1. THE Progress_Indicator SHALL display all Wizard_Steps as connected nodes with labels, showing the current step as highlighted using the `--accent` CSS custom property
2. WHEN a Wizard_Step has been completed (all required fields valid), THE Progress_Indicator SHALL display a checkmark icon in that step's node
3. WHEN a Wizard_Step has validation errors, THE Progress_Indicator SHALL display a warning icon in that step's node using the `--warning` CSS custom property
4. THE Progress_Indicator SHALL display a progress bar or connecting line between step nodes that fills proportionally to the user's advancement through the wizard
5. WHEN a user clicks on a completed step node in the Progress_Indicator, THE Submit_Form SHALL navigate to that step
6. THE Progress_Indicator SHALL prevent navigation to steps beyond the current step plus one (users cannot skip ahead past unvalidated steps)
7. WHEN the viewport width is 480px or less, THE Progress_Indicator SHALL display step numbers and icons only, hiding the step labels to conserve horizontal space

### Requirement 8: Draft Saving and Restoration

**User Story:** As a hack submitter, I want my form progress saved automatically, so that I can close the browser and resume my submission later without losing data.

#### Acceptance Criteria

1. WHEN a user changes any form field value, THE Submit_Form SHALL save the current form state to `localStorage` within 2 seconds using a debounced save mechanism
2. THE Submit_Form SHALL store draft data under the key `uromm_submission_draft` in `localStorage` as a JSON object containing all form field values and the current Wizard_Step number
3. WHEN the Submit_Form loads and a draft exists in `localStorage`, THE Submit_Form SHALL display a prompt asking the user whether to restore the saved draft or start a new submission
4. WHEN the user chooses to restore a draft, THE Submit_Form SHALL populate all form fields with the saved values and navigate to the saved Wizard_Step
5. WHEN a submission is successfully completed, THE Submit_Form SHALL remove the draft from `localStorage`
6. WHEN the user clicks a "Clear Draft" button, THE Submit_Form SHALL remove the draft from `localStorage` and reset all form fields to their default values
7. THE Submit_Form SHALL store uploaded file references (file name and size) in the draft but not the file binary data (files must be re-uploaded after restoration)
8. WHEN a draft is restored that references previously uploaded files, THE Submit_Form SHALL display a notice indicating which files need to be re-uploaded
