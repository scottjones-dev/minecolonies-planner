# Xaero world-map backgrounds

[Xaero's official World Map page](https://www.curseforge.com/minecraft/mc-mods/xaeros-world-map)
documents PNG export for the explored map. The planner can use that PNG as a
north-up terrain layer beneath its block, chunk, claim, guard, commute, and
building overlays.

## Export and import

1. Open Xaero's fullscreen World Map in Minecraft.
2. Turn on cursor coordinates and note the X/Z block represented by the
   top-left edge of the area that will be exported.
3. Use Xaero's PNG export button and wait for the image to finish.
4. In the planner, select the map-pin button in the header and choose that PNG.
5. Enter the noted top-left X and Z. Use `1` pixel per block for a full-size
   1:1 export, `0.5` for a half-size export, or the scale selected in Xaero.
6. Adjust opacity so both terrain and planner overlays remain readable.

The extent shown in the import dialog is calculated before saving, which makes
reversed axes or an incorrect scale visible. North remains at the top, X grows
to the right, and Z grows downward, matching the planner canvas.

The PNG and its calibration stay in this browser's IndexedDB. They are not
uploaded and are not placed inside exported planner JSON. The current browser
stores one active Xaero background, shared by its local colony layouts. PNGs
larger than 100 MB should be exported in a smaller area or at a smaller scale.
