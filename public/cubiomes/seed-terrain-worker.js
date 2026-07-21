/* Keep cubiomes generation off the UI thread. Attribution and source details:
 * third_party/cubiomes. */
importScripts("cubiomes.js");

let modulePromise;

self.onmessage = async (event) => {
  const request = event.data;
  try {
    modulePromise ??= createCubiomes({
      locateFile: (file) => new URL(file, self.location.href).href,
    });
    const module = await modulePromise;
    const output = module._malloc(request.width * request.height * 4);
    try {
      const result = module._render_biomes(
        request.version,
        request.seedLow,
        request.seedHigh,
        request.dimension,
        request.flags,
        request.x,
        request.z,
        request.width,
        request.height,
        output,
      );
      if (result !== 0) throw new Error(`Biome generation failed (${result}).`);
      const ids = module.HEAP32.slice(
        output / 4,
        output / 4 + request.width * request.height,
      );
      self.postMessage({ id: request.id, ids: ids.buffer }, [ids.buffer]);
    } finally {
      module._free(output);
    }
  } catch (error) {
    self.postMessage({
      id: request.id,
      error: error instanceof Error ? error.message : "Biome generation failed.",
    });
  }
};
