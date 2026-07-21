# World profiles and map sources

Every local or exported colony layout stores its Java world seed, supported
Minecraft version, dimension, generator profile, and map-source calibration.
Version-1 layouts are upgraded automatically when they are opened.

## Seed-biome fallback

When a seed is present, the planner uses
[cubiomes](https://github.com/Cubitect/cubiomes) to draw the vanilla Java biome
layout below the planner grid. This is a planning fallback, not a world-save
render: it cannot show explored chunks, player builds, surface detail,
datapacks, or modded generation. A `modded or custom` profile therefore stores
the seed but deliberately disables this fallback.

## Explored map imagery

The map-pin action accepts north-up PNG, JPEG, and WebP images from Xaero's
World Map, JourneyMap, VoxelMap, MapWriter, or another exporter. Set the
Minecraft X/Z coordinate represented by the top-left pixel and the export's
pixels-per-block scale. The real explored image is rendered above the seed
biomes and below the chunk grid, claims, guard ranges, and buildings.

The image blob stays local in IndexedDB; layouts and JSON exports contain only
its source and calibration metadata. Reattach the image when moving an export
to another browser. Existing Xaero PNG data from the original implementation
is migrated on first use.

## JourneyMap ZIP import

JourneyMap's settings screen can export the selected world dimensions to a ZIP.
Choose **Import JourneyMap ZIP** in the map-image tab and select that export.
The planner reads only coordinate-named PNG tiles, selects the current world
profile's dimension and best available surface type (`day`, then `topo`,
`biome`, or `night`), and composes a calibrated local mosaic.

JourneyMap tiles are 512 pixels/blocks and are named by signed tile X/Z. This
matches the open-source
[JourneyMap Tools stitcher](https://github.com/TeamJM/journeymap-tools), which
also uses a 512-pixel tile and a 16-pixel chunk grid. Very broad maps are
downscaled to a maximum 4096-pixel edge while retaining the correct
pixels-per-block calibration. Empty/unexplored tiles remain transparent so the
seed-biome fallback can show through.
