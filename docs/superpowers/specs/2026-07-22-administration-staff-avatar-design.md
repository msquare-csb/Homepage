# Administration Staff Avatar Design

## Scope

- Move the staff section to the end of Current Members.
- Change the section label from `Staff` to `Administration Staff`.
- Keep the Hee Soo Kim card limited to the name and email address.
- Add an original placeholder portrait at `/images/members/hee_soo_kim-placeholder.png`.

## Visual Design

The placeholder will be a new, identity-neutral grayscale illustration rather than a copy of the supplied reference. It will use a front-facing head-and-shoulders composition, a simple feminine hairstyle, a plain dark gray crew-neck top without a blazer, restrained gray shading, a plain white or very light gray background, and a 3:4 portrait crop. It will contain no text, logo, watermark, or photorealistic facial detail.

## Data And Rendering

The existing `Staff` category remains the internal grouping key. Only its display label and position change. The generated image path replaces the empty `photo` value for Hee Soo Kim; no role, affiliation, biography, research field, or detail panel is added.

## Verification

- Content tests confirm that `Administration Staff` is the final current-member section.
- Content tests confirm the new project-local photo path.
- The full test suite and production build must pass.
- Browser inspection confirms the new section order, image rendering, name, and email without console errors.
