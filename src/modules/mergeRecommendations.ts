import { type DataTypes } from "./types_files";

// Combines collaborative and content-based recommendation lists into a single,
// deduplicated list capped at 7 items (enough to fill the UI row).
export const mergeRecommendations = (
  collaborativeItems: DataTypes[],
  contentItems: DataTypes[]
): DataTypes[] => {
  const finalHybridList = [...collaborativeItems, ...contentItems];
  const uniqueRecommendations = finalHybridList.filter((item, index, self) =>
    index === self.findIndex((m) => m.id === item.id)
  );
  return uniqueRecommendations.slice(0, 7);
};