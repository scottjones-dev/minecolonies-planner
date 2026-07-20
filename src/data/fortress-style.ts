import fortressSource from "@/data/generated/styles/fortress.json";
import { adaptBuiltInStylePack } from "@/data/style-pack-adapter";

export const fortressStylePack = adaptBuiltInStylePack(
  fortressSource.stylePack,
);
