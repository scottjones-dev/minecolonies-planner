import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { gunzipSync } from "node:zlib";

const plannerRoot = resolve(import.meta.dirname, "..");
const sourceRoot = resolve(
  process.env.MINECOLONIES_SOURCE ?? join(plannerRoot, "minecolonies"),
);
const blueprintPacksRoot = join(
  sourceRoot,
  "src/main/resources/blueprints/minecolonies",
);
const outputPath = join(
  plannerRoot,
  "src/data/generated/minecolonies-1.20.1.json",
);
const styleOutputDirectory = join(plannerRoot, "src/data/generated/styles");
const loaderOutputPath = join(
  plannerRoot,
  "src/data/generated/style-pack-loaders.ts",
);
const modBuildingsPath = join(
  sourceRoot,
  "src/main/java/com/minecolonies/api/colony/buildings/ModBuildings.java",
);
const modBuildingsInitializerPath = join(
  sourceRoot,
  "src/main/java/com/minecolonies/apiimp/initializer/ModBuildingsInitializer.java",
);

if (!existsSync(join(sourceRoot, ".git")) || !existsSync(blueprintPacksRoot)) {
  throw new Error(
    `MineColonies source was not found at ${sourceRoot}. Clone it there or set MINECOLONIES_SOURCE.`,
  );
}

class NbtReader {
  constructor(buffer) {
    this.buffer = buffer;
    this.offset = 0;
  }

  byte() {
    return this.buffer.readInt8(this.offset++);
  }

  unsignedByte() {
    return this.buffer.readUInt8(this.offset++);
  }

  short() {
    const value = this.buffer.readInt16BE(this.offset);
    this.offset += 2;
    return value;
  }

  unsignedShort() {
    const value = this.buffer.readUInt16BE(this.offset);
    this.offset += 2;
    return value;
  }

  int() {
    const value = this.buffer.readInt32BE(this.offset);
    this.offset += 4;
    return value;
  }

  string() {
    const length = this.unsignedShort();
    const value = this.buffer.toString(
      "utf8",
      this.offset,
      this.offset + length,
    );
    this.offset += length;
    return value;
  }

  number(type) {
    if (type === 1) return this.byte();
    if (type === 2) return this.short();
    if (type === 3) return this.int();
    if (type === 4) {
      const value = Number(this.buffer.readBigInt64BE(this.offset));
      this.offset += 8;
      return value;
    }
    throw new Error(`Expected an integer NBT tag, received type ${type}`);
  }

  skip(type) {
    if (type === 0) return;
    if (type === 1) this.offset += 1;
    else if (type === 2) this.offset += 2;
    else if (type === 3 || type === 5) this.offset += 4;
    else if (type === 4 || type === 6) this.offset += 8;
    else if (type === 7) {
      const length = this.int();
      this.offset += length;
    } else if (type === 8) {
      const length = this.unsignedShort();
      this.offset += length;
    } else if (type === 9) {
      const elementType = this.unsignedByte();
      const length = this.int();
      for (let index = 0; index < length; index++) this.skip(elementType);
    } else if (type === 10) {
      while (true) {
        const childType = this.unsignedByte();
        if (childType === 0) break;
        this.string();
        this.skip(childType);
      }
    } else if (type === 11) {
      const length = this.int();
      this.offset += length * 4;
    } else if (type === 12) {
      const length = this.int();
      this.offset += length * 8;
    } else throw new Error(`Unsupported NBT tag type ${type}`);
  }

  integerCompound() {
    const value = {};
    while (true) {
      const type = this.unsignedByte();
      if (type === 0) return value;
      const name = this.string();
      if ([1, 2, 3, 4].includes(type)) value[name] = this.number(type);
      else this.skip(type);
    }
  }
}

function readBlueprintMetadata(path) {
  const reader = new NbtReader(gunzipSync(readFileSync(path)));
  const rootType = reader.unsignedByte();
  if (rootType !== 10)
    throw new Error(`${path} does not contain an NBT compound root`);
  reader.string();

  const metadata = {};
  const scanMetadataCompound = () => {
    while (true) {
      const type = reader.unsignedByte();
      if (type === 0) return;
      const name = reader.string();
      if (name === "primary_offset" && type === 10) {
        metadata.primary_offset = reader.integerCompound();
      } else if (type === 10) {
        scanMetadataCompound();
      } else {
        reader.skip(type);
      }
    }
  };

  while (true) {
    const type = reader.unsignedByte();
    if (type === 0) break;
    const name = reader.string();
    if (["size_x", "size_y", "size_z"].includes(name)) {
      metadata[name] = reader.number(type);
    } else if (name === "primary_offset" && type === 10) {
      metadata.primary_offset = reader.integerCompound();
    } else if (name === "optional_data" && type === 10) {
      scanMetadataCompound();
    } else {
      reader.skip(type);
    }
  }

  const {
    size_x: sizeX,
    size_y: sizeY,
    size_z: sizeZ,
    primary_offset: anchor,
  } = metadata;
  if (
    !Number.isInteger(sizeX) ||
    !Number.isInteger(sizeY) ||
    !Number.isInteger(sizeZ) ||
    !anchor ||
    !Number.isInteger(anchor.x) ||
    !Number.isInteger(anchor.y) ||
    !Number.isInteger(anchor.z)
  ) {
    throw new Error(`Missing dimensions or primary_offset in ${path}`);
  }

  return {
    size: { x: sizeX, y: sizeY, z: sizeZ },
    anchor,
    bounds: {
      minX: 0,
      maxX: sizeX - 1,
      minY: 0,
      maxY: sizeY - 1,
      minZ: 0,
      maxZ: sizeZ - 1,
    },
  };
}

function walkBlueprints(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walkBlueprints(path);
    return entry.isFile() && entry.name.endsWith(".blueprint") ? [path] : [];
  });
}

function titleCase(value) {
  return value
    .replaceAll(/[_-]+/g, " ")
    .replaceAll(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll(/\b\w/g, (character) => character.toUpperCase());
}

function normalizeBuildingType(baseName) {
  const normalized = baseName
    .replace(/^alt/, "")
    .replace(/alt$/, "")
    .replaceAll(/([a-z])([A-Z])/g, "$1_$2")
    .replaceAll(/[^a-zA-Z0-9]+/g, "_")
    .toLowerCase();

  return (
    {
      guardtower: "guard_tower",
      townhall: "town_hall",
    }[normalized] ?? normalized
  );
}

function readClaimingBuildingTypes() {
  const constants = new Map(
    [
      ...readFileSync(modBuildingsPath, "utf8").matchAll(
        /public static final String\s+([A-Z_]+_ID)\s*=\s*"([^"]+)"/g,
      ),
    ].map((match) => [match[1], normalizeBuildingType(match[2])]),
  );
  const registeredConstants = [
    ...readFileSync(modBuildingsInitializerPath, "utf8").matchAll(
      /DEFERRED_REGISTER\.register\(ModBuildings\.([A-Z_]+_ID)/g,
    ),
  ].map((match) => match[1]);

  return [...new Set(registeredConstants.map((name) => constants.get(name)))]
    .filter(Boolean)
    .sort();
}

const claimingBuildingTypes = readClaimingBuildingTypes();

const fortressStableVariantIds = {
  "fundamentals/residence": "fortress-residence-1",
  "fundamentals/townhall": "fortress-town-hall-1",
  "military/guardtower": "fortress-guard-tower-1",
};

function getGameSortPath(styleRoot, directoryPath, sourcePath) {
  const hasSubCategories = readdirSync(join(styleRoot, directoryPath), {
    withFileTypes: true,
  }).some((entry) => entry.isDirectory());
  const fileName = sourcePath.split("/").at(-1);
  return hasSubCategories
    ? `${directoryPath}/./${fileName}`
    : `${directoryPath}/${fileName}`;
}

function extractStylePack(packId) {
  const styleRoot = join(blueprintPacksRoot, packId);
  const packMetadata = JSON.parse(
    readFileSync(join(styleRoot, "pack.json"), "utf8"),
  );
  const categoryOrder = readdirSync(styleRoot, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        existsSync(join(styleRoot, entry.name, "icon.png")),
    )
    .map((entry) => entry.name)
    .sort();
  const groups = new Map();

  for (const path of walkBlueprints(styleRoot).sort()) {
    const sourcePath = relative(styleRoot, path).split(sep).join("/");
    const match =
      sourcePath.match(/^(.+)\/([^/]+?)([1-5])\.blueprint$/) ??
      sourcePath.match(/^(.+)\/([^/]+)\.blueprint$/);
    if (!match) continue;
    const [, directoryPath, baseName, levelText = "1"] = match;
    const topLevelDirectory = directoryPath.split("/")[0];
    const key = `${directoryPath}/${baseName}`;
    const stableId =
      packId === "fortress" ? fortressStableVariantIds[key] : undefined;
    const group = groups.get(key) ?? {
      id:
        stableId ??
        `${packId}-${key.replaceAll(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`,
      name: `${packMetadata.name} ${titleCase(baseName)}`,
      buildingType: normalizeBuildingType(baseName),
      category: topLevelDirectory,
      categoryPath: directoryPath,
      gameSortPath: getGameSortPath(styleRoot, directoryPath, sourcePath),
      role: /residence|citizen/i.test(baseName)
        ? "residence"
        : topLevelDirectory === "decorations" || topLevelDirectory === "walls"
          ? "other"
          : "workplace",
      ...(topLevelDirectory === "military" &&
      /(guardtower|barrackstower|gatehouse)/i.test(baseName)
        ? { isGuard: true }
        : {}),
      levels: [],
    };
    const metadata = readBlueprintMetadata(path);
    group.levels.push({
      level: Number(levelText),
      bounds: metadata.bounds,
      anchor: metadata.anchor,
      hutBlock: metadata.anchor,
      sourcePath,
      size: metadata.size,
    });
    groups.set(key, group);
  }

  const variants = [...groups.values()]
    .sort((left, right) =>
      left.gameSortPath < right.gameSortPath
        ? -1
        : left.gameSortPath > right.gameSortPath
          ? 1
          : 0,
    )
    .map(({ gameSortPath: _gameSortPath, ...group }, gameOrder) => ({
      ...group,
      gameOrder,
      levels: group.levels.sort((left, right) => left.level - right.level),
    }));

  return {
    id: packId,
    name: packMetadata.name,
    description: packMetadata.desc,
    authors: packMetadata.authors ?? [],
    version: String(packMetadata.version ?? ""),
    source: "built-in",
    categoryOrder,
    variants,
  };
}

function readGitCommit(repositoryRoot) {
  const gitPath = join(repositoryRoot, ".git");
  const head = readFileSync(join(gitPath, "HEAD"), "utf8").trim();
  if (!head.startsWith("ref: ")) return head;

  const reference = head.slice(5);
  const looseReferencePath = join(gitPath, reference);
  if (existsSync(looseReferencePath)) {
    return readFileSync(looseReferencePath, "utf8").trim();
  }

  const packedReference = readFileSync(join(gitPath, "packed-refs"), "utf8")
    .split("\n")
    .find((line) => line.endsWith(` ${reference}`));
  if (!packedReference)
    throw new Error(`Could not resolve Git reference ${reference}`);
  return packedReference.split(" ")[0];
}

const commit = readGitCommit(sourceRoot);
const gradleProperties = readFileSync(
  join(sourceRoot, "gradle.properties"),
  "utf8",
);
const minecraftVersion = gradleProperties
  .match(/^minecraftVersion=(.+)$/m)?.[1]
  ?.trim();
const structurizeVersion = gradleProperties
  .match(/^structurize_version=(.+)$/m)?.[1]
  ?.trim();

const provenance = {
  project: "ldtteam/minecolonies",
  commit,
  minecraftVersion,
  license: "GPL-3.0",
  structurize: {
    version: structurizeVersion,
    tag: "v1.20.1-1.0.806-snapshot",
    commit: "8f6cad27f311eec2d8aee8b7c7bd58aa52edcd84",
    categoryOrdering:
      "StructurePacks.getCategories sorts by Category.toString (subPath)",
    blueprintOrdering:
      "StructurePacks.getBlueprints sorts by Blueprint.getFileName",
  },
  sources: {
    blueprints: "src/main/resources/blueprints/minecolonies",
    serverConfiguration:
      "src/main/java/com/minecolonies/api/configuration/ServerConfiguration.java",
    chunkClaims:
      "src/main/java/com/minecolonies/core/util/ChunkDataHelper.java",
    buildingClaims:
      "src/main/java/com/minecolonies/core/colony/buildings/AbstractBuilding.java",
    registeredBuildings:
      "src/main/java/com/minecolonies/apiimp/initializer/ModBuildingsInitializer.java",
    blueprintPlacement:
      "src/main/java/com/minecolonies/core/placementhandlers/main/SurvivalHandler.java",
    townHallClaims:
      "src/main/java/com/minecolonies/core/colony/buildings/workerbuildings/BuildingTownHall.java",
    guardTowerClaims:
      "src/main/java/com/minecolonies/core/colony/buildings/workerbuildings/BuildingGuardTower.java",
    guardPatrol:
      "src/main/java/com/minecolonies/core/colony/buildings/AbstractBuildingGuards.java",
    guardProtection:
      "src/main/java/com/minecolonies/core/colony/managers/RegisteredStructureManager.java",
    colonyMapRanges:
      "src/main/java/com/minecolonies/core/client/gui/map/WindowColonyMap.java",
  },
};
const rules = {
  chunkSizeBlocks: 16,
  defaults: {
    initialColonyRadiusChunks: 4,
    maximumColonyRadiusChunks: 20,
    minimumColonyDistanceChunks: 8,
  },
  limits: {
    initialColonyRadiusChunks: { min: 1, max: 15 },
    maximumColonyRadiusChunks: { min: 1, max: 250 },
    minimumColonyDistanceChunks: { min: 1, max: 200 },
  },
  buildingClaimRadiusByLevel: [1, 1, 1, 2, 2],
  townHallClaimRadiusByLevel: [1, 1, 2, 3, 5],
  guardTowerClaimRadiusByLevel: [2, 3, 3, 4, 5],
  gateHouseClaimRadiusByLevel: [1, 1, 2],
  barracksClaimRadiusByLevel: [2, 2, 2, 2, 2],
  barracksTowerClaimRadiusByLevel: [0, 0, 0, 0, 0],
  guardPatrolRadiusBlocksByLevel: [80, 110, 140, 170, 200],
  claimingBuildingTypes,
};
const stylePackIds = readdirSync(blueprintPacksRoot, { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isDirectory() &&
      existsSync(join(blueprintPacksRoot, entry.name, "pack.json")),
  )
  .map((entry) => entry.name)
  .sort();
const stylePacks = stylePackIds.map(extractStylePack);
const document = {
  schemaVersion: 1,
  provenance,
  rules,
  stylePacks: stylePacks.map((stylePack) => ({
    id: stylePack.id,
    name: stylePack.name,
    description: stylePack.description,
    authors: stylePack.authors,
    version: stylePack.version,
    categoryOrder: stylePack.categoryOrder,
    variantCount: stylePack.variants.length,
    levelCount: stylePack.variants.reduce(
      (sum, variant) => sum + variant.levels.length,
      0,
    ),
  })),
};

mkdirSync(dirname(outputPath), { recursive: true });
rmSync(styleOutputDirectory, { recursive: true, force: true });
mkdirSync(styleOutputDirectory, { recursive: true });
for (const stylePack of stylePacks) {
  writeFileSync(
    join(styleOutputDirectory, `${stylePack.id}.json`),
    `${JSON.stringify({ schemaVersion: 1, provenance, stylePack }, null, 2)}\n`,
  );
}
writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);
writeFileSync(
  loaderOutputPath,
  `${[
    "// Generated by scripts/extract-minecolonies.mjs. Do not edit manually.",
    "export const builtInStylePackLoaders = {",
    ...stylePackIds.map(
      (stylePackId) =>
        `  ${stylePackId}: () => import(${JSON.stringify(`./styles/${stylePackId}.json`)}),`,
    ),
    "} as const;",
    "",
    "export type BuiltInStylePackId = keyof typeof builtInStylePackLoaders;",
    "",
  ].join("\n")}`,
);
const totalVariants = document.stylePacks.reduce(
  (sum, stylePack) => sum + stylePack.variantCount,
  0,
);
const totalLevels = document.stylePacks.reduce(
  (sum, stylePack) => sum + stylePack.levelCount,
  0,
);
console.log(
  `Extracted ${stylePacks.length} style packs with ${totalVariants} variants (${totalLevels} levels) from ${commit.slice(0, 12)}.`,
);
