import { type DataTypes } from "../types_files";

export type MediaType = "movie" | "tv";

export interface BlendOptions {
  mediaType: MediaType;
  // IDs that must never be recommended (e.g. already watched or already rated)
  excludeIds?: Iterable<number>;
  // How many items each primary pool may contribute in the first, "fair share" pass
  perPoolQuota?: number;
  // Maximum length of the final list
  limit?: number;
}

// TMDB detail responses have no media_type, so fall back to the title/name heuristic
export const inferMediaType = (item: DataTypes): MediaType =>
  (item.media_type as MediaType) || (item.name && !item.title ? "tv" : "movie");

export interface BlendedItem {
  item: DataTypes;
  // Index of the pool that placed this item: primary pools first, then fallback pools
  poolIndex: number;
}

/**
 * Blends several recommendation pools into one deduplicated list and remembers
 * which pool placed each item (used by the admin explainability view).
 *
 * 1. Fair-share pass: each primary pool contributes up to `perPoolQuota` items, in pool order.
 * 2. Backfill pass: remaining slots are filled from the primary pools, in pool order.
 * 3. Fallback pass: only if slots are still empty, items are taken from the fallback pools.
 *
 * Items of the wrong media type, excluded IDs and duplicates are always skipped.
 */
export const blendWithProvenance = (
  primaryPools: DataTypes[][],
  fallbackPools: DataTypes[][] = [],
  { mediaType, excludeIds = [], perPoolQuota = 3, limit = 12 }: BlendOptions
): BlendedItem[] => {
  const result: BlendedItem[] = [];
  const seenIds = new Set<number>(excludeIds);

  const tryAdd = (item: DataTypes | undefined, poolIndex: number): boolean => {
    if (result.length >= limit) return false;
    if (!item || !item.id || seenIds.has(item.id)) return false;
    if (inferMediaType(item) !== mediaType) return false;
    seenIds.add(item.id);
    result.push({ item: { ...item, media_type: mediaType }, poolIndex });
    return true;
  };

  // 1. Fair-share pass
  primaryPools.forEach((pool, poolIndex) => {
    let taken = 0;
    for (const item of pool) {
      if (taken >= perPoolQuota) break;
      if (tryAdd(item, poolIndex)) taken++;
    }
  });

  // 2. Backfill pass, then 3. fallback pass
  const allPools = [...primaryPools, ...fallbackPools];
  for (let poolIndex = 0; poolIndex < allPools.length; poolIndex++) {
    for (const item of allPools[poolIndex]) {
      if (result.length >= limit) return result;
      tryAdd(item, poolIndex);
    }
  }

  return result;
};

/**
 * Same as blendWithProvenance, but returns only the items (used by the home page row).
 */
export const blendRecommendationPools = (
  primaryPools: DataTypes[][],
  fallbackPools: DataTypes[][] = [],
  options: BlendOptions
): DataTypes[] => blendWithProvenance(primaryPools, fallbackPools, options).map((b) => b.item);
