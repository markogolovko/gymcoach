# Exercise illustration prompt

Use this template to create a static exercise demonstration. Fill in every bracketed field and keep the style block unchanged across exercises.

```text
Create a clear exercise instruction illustration as a sequence of [2 or 3] panels, read left to right. Show the same adult figure, clothing, proportions, and equipment in every panel.

Exercise: [exercise name]
Equipment: [equipment]
Camera angle: [camera angle that best shows the important joints]
Starting position: [precise starting position]
Finishing position: [precise finishing position]
Intermediate position, if needed: [one important transition, or "none"]
Key movement cues: [short, observable cues]

Style: clean, restrained 2D fitness manual illustration. Use anatomically plausible joints and proportions; show body positions and equipment accurately. Use simple charcoal linework, muted neutral fills, and one small lime accent only to indicate the moving area or direction. Use the same plain warm light-gray background for every exercise, with no decorative gym scenery.

Keep the entire figure and relevant equipment visible in each panel. Make panel sizes, camera angle, scale, and figure appearance consistent. No text, labels, logos, muscle coloring, exaggerated anatomy, extra limbs, or motion blur. Leave clear space between panels so the sequence reads on a phone.
```

## Asset naming

Use catalog IDs from `src/data/exercises.json` as stable asset names, for example `public/exercises/goblet_squat/01.jpg` and `02.jpg`. Use a third `03.jpg` frame only when the transition matters. Keep generation outside the app; the app should load these files as ordinary static assets. The source map in `src/data/exercise-images.json` lets future illustrations replace the current files without changing exercise IDs.

## Review checklist

- Verify pose, joint alignment, equipment grip, and panel order against an authoritative form reference.
- Reject anatomical artifacts or ambiguous movement paths.
- Check that the figure and equipment remain legible at phone width.
- Record the source, license, and review status for each reused or generated asset.
