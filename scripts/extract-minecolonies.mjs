import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { gunzipSync } from "node:zlib";

const plannerRoot = resolve(import.meta.dirname, "..");
const sourceRoot = resolve(
  process.env.MINECOLONIES_SOURCE ?? join(plannerRoot, "minecolonies"),
);
const blueprintRoot = join(
  sourceRoot,
  "src/main/resources/blueprints/minecolonies/fortress",
);
const outputPath = join(
  plannerRoot,
  "src/data/generated/minecolonies-1.20.1.json",
);

if (!existsSync(join(sourceRoot, ".git")) || !existsSync(blueprintRoot)) {
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
      minX: -anchor.x,
      maxX: sizeX - anchor.x - 1,
      minY: -anchor.y,
      maxY: sizeY - anchor.y - 1,
      minZ: -anchor.z,
      maxZ: sizeZ - anchor.z - 1,
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

function categoryFor(directory, baseName) {
  if (/residence|citizen/.test(baseName)) return "housing";
  if (
    /bakery|cook|restaurant|compost|fisher|farmer|swine|cowboy|shepherd|chicken/.test(
      baseName,
    )
  )
    return "food";
  if (/warehouse|courier|stash/.test(baseName)) return "storage";
  if (directory === "military") return "military";
  if (directory === "education") return "education";
  if (directory === "craftsmanship" || directory === "agriculture")
    return "production";
  if (directory === "decorations" || directory === "walls") return "decoration";
  return "services";
}

function normalizeBuildingType(baseName) {
  return baseName
    .replace(/^alt/, "")
    .replace(/alt$/, "")
    .replaceAll(/([a-z])([A-Z])/g, "$1_$2")
    .replaceAll(/[^a-zA-Z0-9]+/g, "_")
    .toLowerCase();
}

const groups = new Map();
for (const path of walkBlueprints(blueprintRoot).sort()) {
  const sourcePath = relative(blueprintRoot, path).split(sep).join("/");
  const match =
    sourcePath.match(/^(.+)\/([^/]+?)([1-5])\.blueprint$/) ??
    sourcePath.match(/^(.+)\/([^/]+)\.blueprint$/);
  if (!match) continue;
  const [, directoryPath, baseName, levelText = "1"] = match;
  const category = categoryFor(
    directoryPath.split("/")[0],
    baseName.toLowerCase(),
  );
  const key = `${directoryPath}/${baseName}`;
  const group = groups.get(key) ?? {
    id: `fortress-${key.replaceAll(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`,
    name: `Fortress ${titleCase(baseName)}`,
    buildingType: normalizeBuildingType(baseName),
    category,
    role: /residence|citizen/i.test(baseName)
      ? "residence"
      : category === "decoration"
        ? "other"
        : "workplace",
    ...(/(guardtower|barrackstower|gatehouse)/i.test(baseName)
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
const minecraftVersion = readFileSync(
  join(sourceRoot, "gradle.properties"),
  "utf8",
)
  .match(/^minecraftVersion=(.+)$/m)?.[1]
  ?.trim();

const document = {
  schemaVersion: 1,
  provenance: {
    project: "ldtteam/minecolonies",
    commit,
    minecraftVersion,
    license: "GPL-3.0",
    sources: {
      blueprints: "src/main/resources/blueprints/minecolonies/fortress",
      serverConfiguration:
        "src/main/java/com/minecolonies/core/configuration/ServerConfiguration.java",
      chunkClaims:
        "src/main/java/com/minecolonies/core/colony/claims/ChunkDataHelper.java",
      buildingClaims:
        "src/main/java/com/minecolonies/core/colony/buildings/AbstractBuilding.java",
      townHallClaims:
        "src/main/java/com/minecolonies/core/colony/buildings/BuildingTownHall.java",
      guardTowerClaims:
        "src/main/java/com/minecolonies/core/colony/buildings/workerbuildings/BuildingGuardTower.java",
    },
  },
  rules: {
    chunkSizeBlocks: 16,
    defaults: {
      initialColonyRadiusChunks: 4,
      maximumColonyRadiusChunks: 20,
      minimumColonyDistanceChunks: 8,
    },
    buildingClaimRadiusByLevel: [1, 1, 1, 2, 2],
    townHallClaimRadiusByLevel: [1, 1, 2, 3, 5],
    guardTowerClaimRadiusByLevel: [2, 3, 3, 4, 5],
    guardPatrolRadiusBlocksByLevel: [80, 110, 140, 170, 200],
  },
  stylePack: {
    id: "fortress",
    name: "Fortress",
    source: "built-in",
    variants: [...groups.values()]
      .map((group) => ({
        ...group,
        levels: group.levels.sort((left, right) => left.level - right.level),
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);
console.log(
  `Extracted ${document.stylePack.variants.length} Fortress variants (${document.stylePack.variants.reduce((sum, variant) => sum + variant.levels.length, 0)} levels) from ${commit.slice(0, 12)}.`,
);
