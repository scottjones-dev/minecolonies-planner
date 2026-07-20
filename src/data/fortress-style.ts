import type { StylePack } from "@/types/minecolonies";

export const fortressStylePack: StylePack = {
  id: "fortress",
  name: "Fortress",
  source: "built-in",
  variants: [
    {
      id: "fortress-town-hall-1",
      name: "Fortress Town Hall 1",
      buildingType: "town_hall",
      category: "services",
      role: "other",
      levels: [
        {
          level: 1,
          bounds: {
            minX: -7,
            maxX: 7,
            minY: 0,
            maxY: 10,
            minZ: -8,
            maxZ: 8,
          },
          anchor: { x: 0, y: 0, z: 0 },
          hutBlock: { x: 0, y: 0, z: 0 },
          entrance: {
            position: { x: 0, y: 0, z: 8 },
            direction: "south",
          },
        },
        {
          level: 5,
          bounds: {
            minX: -12,
            maxX: 12,
            minY: -1,
            maxY: 20,
            minZ: -13,
            maxZ: 13,
          },
          anchor: { x: 0, y: 0, z: 0 },
          hutBlock: { x: 0, y: 0, z: 0 },
          entrance: {
            position: { x: 0, y: 0, z: 13 },
            direction: "south",
          },
        },
      ],
    },
    {
      id: "fortress-residence-1",
      name: "Fortress Residence 1",
      buildingType: "residence",
      category: "housing",
      role: "residence",
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
      role: "workplace",
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
      role: "workplace",
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
