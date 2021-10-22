# priority-matrix

Collaboratively rate FigJam stickies on 2 axes then plot the results.  
[Video preview (1:47)](https://github.com/brettlyne/priority-matrix/raw/main/Priority_Matrix_demo_10-21-2021.mp4)

<!-- [Priority Matrix in Figma widget gallery](https://www.figma.com/community/widget/1024916888280193111) -->

Built by Design Technologists at Intuit.

### Code organization:

| dir / path           | description                          |
| -------------------- | ------------------------------------ |
| ui-src/              | This is where the iframe code lives  |
| ui-src/index.html    | Main entry point for the iframe code |
| ui-src/tsconfig.json | tsconfig for the iframe code         |
| code.tsx             | This is the widget code              |
| tsconfig.json        | tsconfig for the widget code         |
| dist/                | Built output goes here               |

- The widget code just uses tsc directly like most of our plugin/widget samples
- The iframe code uses a tool called [vite](https://vitejs.dev/) to bundle everything into a single html file

## Getting started

### one-time setup
1. `yarn install`

### importing your widget
1. "Import widget from manifest"
2. Build code `npm run build`
3. Choose your manifest


## Scripts

| script                     | description                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| npm run build              | one-off full build of both the iframe and widget                             |
| npm run build:main         | one-off build of the widget code                                             |
| npm run build:ui           | one-off build of the iframe code                                             |
| npm run build:main:watch   | watch-mode build of the widget code. rebuilds if when you save changes.      |
| npm run build:ui:watch     | watch-mode build ui code. rebuilds if when you save changes.                 |
| npm run build:ui:dev:watch | watch-mode **development** build ui code. rebuilds if when you save changes. |
