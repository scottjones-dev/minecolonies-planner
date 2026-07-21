#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "generator.h"

int render_biomes(
    int mc,
    uint32_t seed_low,
    uint32_t seed_high,
    int dimension,
    uint32_t flags,
    int x,
    int z,
    int width,
    int height,
    int *output)
{
    if (width < 1 || height < 1 || width > 1024 || height > 1024 || !output)
        return 2;

    Generator generator;
    setupGenerator(&generator, mc, flags);
    uint64_t seed = ((uint64_t) seed_high << 32) | seed_low;
    applySeed(&generator, dimension, seed);

    Range range = {4, x, z, width, height, 16, 1};
    int *cache = allocCache(&generator, range);
    if (!cache)
        return 3;

    int result = genBiomes(&generator, cache, range);
    if (result == 0)
        memcpy(output, cache, (size_t) width * height * sizeof(int));
    free(cache);
    return result;
}
