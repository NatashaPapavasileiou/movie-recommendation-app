import { describe, it, expect } from 'vitest';
import { blendRecommendationPools, blendWithProvenance, inferMediaType } from './mergeRecommendations';
import { type DataTypes } from '../types_files';

// Small helper to build a minimal, valid DataTypes item for tests
const makeItem = (id: number, mediaType: 'movie' | 'tv' = 'movie'): DataTypes => ({
  id,
  title: mediaType === 'movie' ? `Movie ${id}` : '',
  poster_path: '/poster.jpg',
  overview: '',
  vote_average: 7,
  name: mediaType === 'tv' ? `Show ${id}` : '',
  backdrop_path: '',
  media_type: mediaType,
  release_date: '2024-01-01',
  first_air_date: '',
});

const ids = (items: DataTypes[]) => items.map((item) => item.id);
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => makeItem(from + i));

describe('blendRecommendationPools', () => {
  it('gives every pool a fair share of 3 before backfilling', () => {
    const pools = [range(1, 6), range(11, 16), range(21, 26), range(31, 36)];

    const result = blendRecommendationPools(pools, [], { mediaType: 'movie' });

    // 4 pools x 3 = 12 items, so no backfill is needed
    expect(ids(result)).toEqual([1, 2, 3, 11, 12, 13, 21, 22, 23, 31, 32, 33]);
  });

  it('backfills from earlier pools when a pool has fewer than 3 items', () => {
    const pools = [range(1, 10), [], [], [makeItem(31)]];

    const result = blendRecommendationPools(pools, [], { mediaType: 'movie', limit: 6 });

    expect(ids(result)).toEqual([1, 2, 3, 31, 4, 5]);
  });

  it('removes duplicates that appear in more than one pool', () => {
    const pools = [[makeItem(1), makeItem(2)], [makeItem(2), makeItem(3)]];

    const result = blendRecommendationPools(pools, [], { mediaType: 'movie' });

    expect(ids(result)).toEqual([1, 2, 3]);
  });

  it('never recommends excluded (already watched or rated) items', () => {
    const pools = [[makeItem(1), makeItem(2), makeItem(3)]];

    const result = blendRecommendationPools(pools, [], { mediaType: 'movie', excludeIds: [2] });

    expect(ids(result)).toEqual([1, 3]);
  });

  it('keeps only items of the requested media type', () => {
    const pools = [[makeItem(1, 'movie'), makeItem(2, 'tv'), makeItem(3, 'tv')]];

    const result = blendRecommendationPools(pools, [], { mediaType: 'tv' });

    expect(ids(result)).toEqual([2, 3]);
    expect(result.every((item) => item.media_type === 'tv')).toBe(true);
  });

  it('uses fallback pools only after all primary pools are exhausted', () => {
    const primary = [[makeItem(1)], [makeItem(2)]];
    const fallback = [range(90, 99)];

    const result = blendRecommendationPools(primary, fallback, { mediaType: 'movie', limit: 4 });

    expect(ids(result)).toEqual([1, 2, 90, 91]);
  });

  it('returns an empty list when every pool is empty (cold start)', () => {
    expect(blendRecommendationPools([[], [], [], []], [], { mediaType: 'movie' })).toEqual([]);
  });
});

describe('inferMediaType', () => {
  it('infers "tv" for TMDB detail objects that only have a name', () => {
    const show = { ...makeItem(5, 'tv'), media_type: '' };
    expect(inferMediaType(show)).toBe('tv');
  });
});

describe('blendWithProvenance', () => {
  it('records which pool placed each item, counting fallback pools after primary pools', () => {
    const primary = [[makeItem(1)], [], [makeItem(3)], []];
    const fallback = [[makeItem(90)], [makeItem(95)]];

    const result = blendWithProvenance(primary, fallback, { mediaType: 'movie', limit: 4 });

    expect(result.map((r) => [r.item.id, r.poolIndex])).toEqual([
      [1, 0],
      [3, 2],
      [90, 4],
      [95, 5],
    ]);
  });

  it('credits a duplicate to the first pool that placed it', () => {
    const primary = [[makeItem(7)], [makeItem(7), makeItem(8)]];

    const result = blendWithProvenance(primary, [], { mediaType: 'movie' });

    expect(result.map((r) => [r.item.id, r.poolIndex])).toEqual([
      [7, 0],
      [8, 1],
    ]);
  });
});
