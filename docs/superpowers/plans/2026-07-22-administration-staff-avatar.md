# Administration Staff Avatar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Administration Staff to the bottom of Current Members and give Hee Soo Kim an original grayscale placeholder portrait.

**Architecture:** Keep `Staff` as the internal member category, while changing its section ordering and public label in `data/member-sections.json`. Store the generated raster asset under `public/images/members/` and reference it from `data/members.json`; the existing conditional image renderer handles the display.

**Tech Stack:** Next.js 15, React 19, JSON content files, Node test runner, built-in image generation.

---

### Task 1: Lock The Content Contract

**Files:**
- Modify: `tests/content-data.test.mjs`
- Test: `tests/content-data.test.mjs`

- [ ] **Step 1: Update the existing Hee Soo Kim test**

Assert that the member photo is `/images/members/hee_soo_kim-placeholder.png`, the staff label is `Administration Staff`, and `staff` is the final entry in `currentSections`.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test --test-name-pattern="Hee Soo Kim" tests/content-data.test.mjs`

Expected: FAIL because the photo is empty, the label is `Staff`, and the section is currently first.

### Task 2: Create The Original Placeholder Portrait

**Files:**
- Create: `public/images/members/hee_soo_kim-placeholder.png`

- [ ] **Step 1: Generate a new raster illustration**

Use the built-in image generator with this prompt:

```text
Create an original website staff-directory placeholder portrait. Front-facing head-and-shoulders feminine silhouette with a simple shoulder-length hairstyle, no facial features, a plain dark gray crew-neck top without a blazer, restrained grayscale tones, subtle flat shading, plain white or very light gray background, centered 3:4 portrait composition. Professional university laboratory website aesthetic. Clearly an illustration, not a photograph and not based on any real person's identity. No text, logo, border, or watermark. Do not copy any existing reference image.
```

- [ ] **Step 2: Inspect and place the asset**

Confirm the image is non-photorealistic, identity-neutral, clean at card size, and contains no text or watermark. Copy the selected output to `public/images/members/hee_soo_kim-placeholder.png`.

### Task 3: Update Member Content And Section Order

**Files:**
- Modify: `data/member-sections.json`
- Modify: `data/members.json`

- [ ] **Step 1: Move and rename the section**

Move the existing object with `id: "staff"` to the final position in `currentSections` and change only its `label` to `Administration Staff`.

- [ ] **Step 2: Connect the generated portrait**

Change Hee Soo Kim's `photo` value to `/images/members/hee_soo_kim-placeholder.png`. Keep the member object limited to `name`, `category`, `email`, and `photo`.

- [ ] **Step 3: Run the focused test and verify success**

Run: `node --test --test-name-pattern="Hee Soo Kim" tests/content-data.test.mjs`

Expected: PASS.

### Task 4: Verify The Website

**Files:**
- Verify: `data/member-sections.json`
- Verify: `data/members.json`
- Verify: `public/images/members/hee_soo_kim-placeholder.png`

- [ ] **Step 1: Run all tests**

Run: `npm.cmd test`

Expected: all tests pass.

- [ ] **Step 2: Run the production build**

Run: `npm.cmd run build`

Expected: exit code 0.

- [ ] **Step 3: Inspect Current Members in the browser**

Verify that `Administration Staff` is the final section, the new portrait renders without distortion, the card contains only `Hee Soo Kim` and `khs1224@skku.edu`, and the browser console has no errors.

Git commit steps are omitted because no Git executable is available in this workspace environment.
