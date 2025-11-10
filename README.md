# OnYu SEN Communication Tool

This is a mobile-first MVP for a SEN-friendly communication web app supporting
emotion boards, needs boards, visual schedules, now & next planning, and linked
social stories with rewards.

## Getting started

1. Open `index.html` in any modern browser (Chrome, Edge, Safari, Firefox).
2. Allow microphone and speech permissions if prompted for speech input/output.
3. Use the **Parent Mode** button (PIN `1234` by default) to unlock editing
   tools.

## Features

- Emotion and Needs boards with TTS feedback and custom card creation.
- Drag-and-drop schedule builder with template save/load in Parent Mode.
- Simple Now & Next board with preset management.
- Social Story generator (text or microphone input) with editable steps.
- Sticker-based reward system linked to social stories.
- Data persistence using `localStorage`.

## Customisation

All assets currently use pastel SVG placeholders stored in `/assets`. Replace
these files with PECS or ARASAAC icons as needed. The application reads custom
uploads via the FileReader API and stores data in the browser.

## Extending the MVP

- **Add authentication**: Replace the simple PIN check with a more secure
  parent login flow.
- **Sync data**: Connect to a real database or cloud sync so progress travels
  between devices.
- **Accessibility**: Localise text-to-speech voices or add multi-language
  support by adjusting the `speak()` helper in `app.js`.
- **Component refactor**: Port modules to a framework (React/Vue/Svelte) while
  preserving the data structure defined in `app.js`.

## Development notes

- Code is organised in plain HTML/CSS/JS for easy prototyping.
- Use browser dev tools to inspect, test responsive layouts, or simulate touch
  input.
- Clearing `localStorage` will reset all custom content to defaults.

### Checking for merge conflicts

If GitHub reports unresolved conflicts, run the helper script to double-check the local
workspace:

```bash
scripts/check_conflicts.sh
```

The script exits with a non-zero status and prints any files that still include conflict
markers or staged conflict entries so you can fix them before pushing.
