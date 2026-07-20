import { fortressStylePack } from "./fortress-style";

export { fortressStylePack };

export const stylePacks = [fortressStylePack];

export function getStylePackById(stylePackId: string) {
  return stylePacks.find((stylePack) => stylePack.id === stylePackId);
}
