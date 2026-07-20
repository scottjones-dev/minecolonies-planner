import type { StylePack } from "@/types/minecolonies";

export const fortressStylePack: StylePack = {
  id: "fortress",
  name: "Fortress",
  source: "built-in",
  variants: [
    {
      id: "fortress-residence-1",
      name: "Fortress Residence 1",
      buildingType: "residence",
      category: "housing",
      levels: [
        {
          level: 1,
          bounds: {
            minX: -6,
            maxX: 6,
            minY: 0,
            maxY: 8,
            minZ: -7,
            maxZ: 7,
          },
          anchor: { x: 0, y: 0, z: 0 },
          hutBlock: { x: 0, y: 0, z: 0 },
          entrance: {
            position: { x: 0, y: 0, z: 7 },
            direction: "south",
          },
        },
        {
          level: 5,
          bounds: {
            minX: -9,
            maxX: 9,
            minY: -1,
            maxY: 15,
            minZ: -10,
            maxZ: 10,
          },
          anchor: { x: 0, y: 0, z: 0 },
          hutBlock: { x: 0, y: 0, z: 0 },
          entrance: {
            position: { x: 0, y: 0, z: 10 },
            direction: "south",
          },
        },
      ],
    },
    {
      id: "fortress-bakery-1",
      name: "Fortress Bakery 1",
      buildingType: "bakery",
      category: "food",
      levels: [
        {
          level: 1,
          bounds: {
            minX: -5,
            maxX: 5,
            minY: 0,
            maxY: 7,
            minZ: -6,
            maxZ: 6,
          },
          anchor: { x: 0, y: 0, z: 0 },
          hutBlock: { x: 0, y: 0, z: 0 },
          entrance: {
            position: { x: 0, y: 0, z: 6 },
            direction: "south",
          },
        },
        {
          level: 5,
          bounds: {
            minX: -8,
            maxX: 8,
            minY: -1,
            maxY: 13,
            minZ: -9,
            maxZ: 9,
          },
          anchor: { x: 0, y: 0, z: 0 },
          hutBlock: { x: 0, y: 0, z: 0 },
          entrance: {
            position: { x: 0, y: 0, z: 9 },
            direction: "south",
          },
        },
      ],
    },
    {
      id: "fortress-guard-tower-1",
      name: "Fortress Guard Tower 1",
      buildingType: "guard_tower",
      category: "military",
      levels: [
        {
          level: 1,
          bounds: {
            minX: -4,
            maxX: 4,
            minY: 0,
            maxY: 12,
            minZ: -4,
            maxZ: 4,
          },
          anchor: { x: 0, y: 0, z: 0 },
          hutBlock: { x: 0, y: 0, z: 0 },
          entrance: {
            position: { x: 0, y: 0, z: 4 },
            direction: "south",
          },
        },
        {
          level: 5,
          bounds: {
            minX: -6,
            maxX: 6,
            minY: -1,
            maxY: 24,
            minZ: -6,
            maxZ: 6,
          },
          anchor: { x: 0, y: 0, z: 0 },
          hutBlock: { x: 0, y: 0, z: 0 },
          entrance: {
            position: { x: 0, y: 0, z: 6 },
            direction: "south",
          },
        },
      ],
    },
  ],
};
