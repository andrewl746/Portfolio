# Project card images

The standard for screenshots shown on project cards, so every image matches on desktop and mobile.

## Format

| | |
|---|---|
| Aspect ratio | 16:10 |
| Size | 1280 × 800 px |
| File type | WebP, quality 82 |
| Target file size | under 250 KB |
| Metadata | all stripped (EXIF, GPS location, XMP) |
| Location | `public/projects/<slug>.webp`, for example `public/projects/suplex.webp` |

Why these numbers: on desktop the image sits below the text at up to 672 px wide, and on a phone it spans the full width (about 330 px). 1280 × 800 is sharp at 2× density on desktop and 3× on phones, and 16:10 suits app screenshots, which are usually wider than tall. Next.js's `<Image>` component serves smaller resized copies to small screens automatically, so the one large file is fine.

## Making one

1. Put the original screenshot in `images-src/` (gitignored, so originals never get committed).
2. Run:

   ```bash
   node scripts/process-project-image.mjs images-src/<file> <slug> [position]
   ```

   `position` picks what survives the crop to 16:10: `center` (default), `top`, `bottom`, `left`, `right`, or `attention` (the most detailed region).
3. Look at the result. If the important part was cropped off, rerun with a different `position`, or crop the original closer to 16:10 first.
4. The script refuses (exits with an error) if any metadata survived. Never commit a project image that fails this check.
5. Clean up so each project has exactly one file in each folder:
   - `public/projects/` holds only the images `lib/content.ts` references, one per project. When an image is replaced, delete the old file in the same step; never leave two versions or crops of the same screenshot.
   - `images-src/` keeps only the one original screenshot each final image came from. Delete intermediate files (crops, edited copies) and originals of screenshots that were replaced.

## Editing before processing

Most screenshots need some cleanup first. Do it on a copy in `images-src/` (Python with Pillow works well), then run the script on the result.

- **Personal data.** Blur street addresses heavily. Replace other people's real names with made-up ones. The owner's own name stays, as plain "Andrew Li" (drop test suffixes like "(student)").
- **Matching text.** When replacing text, render it in the app's own font at its measured size, weight and colour. Fit size and position by diffing a re-render of the original text against the screenshot until they match; first check that the original text re-renders almost pixel for pixel. Where a line continues after the replaced text, move the original remainder of the line along rather than redrawing it, keeping the original gap. If the same word already appears elsewhere in the screenshot, copy those original pixels instead of rendering.
- **Fonts.** Look for the font in the project's own repo (for example a Next.js `.next/static/media/*.woff2`, which Pillow can load) or system fonts. For Google Fonts that aren't on the machine, render the text in a browser instead of downloading font files.
- **Clutter.** Paint out anything cut off by the crop (a half-visible search bar or button), floating widgets, and library credit labels like React Flow's, using the surrounding background colour. To repair a symmetric element that something overlapped, mirror its undamaged side.
- **Margins.** Keep visible breathing room (about 50 px at 1280 × 800) between the app's content and the image edge. Too-tight crops were the most common complaint. When the app background is a flat colour, fill extra margin with that colour rather than including sidebars, scrollbars or window edges.
- **Fitting 16:10.** If the content is too tall for 16:10, the frame adds side bars and the text shrinks. Prefer cutting a redundant row or line (remove the whole thing, keeping dividers and borders intact, and keep the rest of the screenshot consistent with it). If it's too wide, a strip of pure empty space can be cut out of the middle, but only after checking every column in the strip is identical.

## What to capture

- The one moment that sells the project, for example the 3D design rising on a lot for Suplex, or the schedule view for OlympIQ.
- Dark mode where the app has it, so it sits well on the site's dark background.
- Text big enough to read at card size. Apps screenshotted on a wide monitor shrink a lot; zoom the browser to 125–150% or narrow the window before capturing, or crop to the part that matters. For canvas apps (graphs, maps, 3D scenes), zoom the canvas itself so the content fills it; tiny node labels stay blurry no matter how they're cropped.
- A tight crop with no browser chrome, no personal tabs or bookmarks, and no small unreadable text.
- No personal data in the screenshot (real names, emails, addresses) unless it's public or yours to share.

## Display

Add the image to the project in `lib/content.ts`:

```ts
image: { src: "/projects/<slug>.webp", alt: "What the screenshot shows" },
```

The card (`components/sections/Projects.tsx`) then shows it below the text and links, as wide as the description (up to 672 px) on desktop and full width on mobile, through `next/image` with a thin border. Projects without an image keep the plain text layout.

These are applied by the card automatically, so don't bake them into the image files:

- **Dimming:** every screenshot is shown at 85% brightness and 90% saturation (`brightness-85 saturate-90`), so bright or light-mode apps sit in the dark page instead of glaring.
- **Quality:** served at `quality={90}` (allowed by `images.qualities` in `next.config.ts`), since the default 75 softens small UI text.
- **Frame:** static, dim ember viewfinder corner brackets (the `.viewfinder` class in `app/globals.css`). No hover effects: the image isn't clickable, and the site only uses hover effects on things that are, apart from the decorative tech stack icons.

When replacing an image during development, give the new file a new name (for example `-v2`). The running dev server caches resized images in memory by URL and keeps serving the old picture under an unchanged name. Production deploys aren't affected.
