import { describe, it, expect } from 'vitest';
import { mergeRecommendations } from './mergeRecommendations';
import { type DataTypes } from './types_files';

// Small helper to build a minimal, valid DataTypes item for tests
const makeItem = (id: number): DataTypes => ({
  id,
  title: `Movie ${id}`,
  poster_path: '/poster.jpg',
  overview: '',
  vote_average: 7,
  name: '',
  backdrop_path: '',
  media_type: 'movie',
  release_date: '2024-01-01',
  first_air_date: '',
});

describe('mergeRecommendations', () => {
  it('combines items from both sources when there is no overlap', () => {
    const collaborative = [makeItem(1), makeItem(2)];
    const content = [makeItem(3), makeItem(4)];

    const result = mergeRecommendations(collaborative, content);

    expect(result.map((item) => item.id)).toEqual([1, 2, 3, 4]);
  });

  it('removes duplicate items that appear in both sources, keeping the collaborative one', () => {
    const collaborative = [makeItem(1), makeItem(2)];
    const content = [makeItem(2), makeItem(3)];

    const result = mergeRecommendations(collaborative, content);

    // id 2 should only appear once, and it should be the collaborative-source instance
    expect(result.map((item) => item.id)).toEqual([1, 2, 3]);
  });

  it('caps the result at 7 items even when more are available', () => {
    const collaborative = [makeItem(1), makeItem(2), makeItem(3), makeItem(4)];
    const content = [makeItem(5), makeItem(6), makeItem(7), makeItem(8), makeItem(9)];

    const result = mergeRecommendations(collaborative, content);

    expect(result).toHaveLength(7);
    expect(result.map((item) => item.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('returns an empty list when both sources are empty', () => {
    expect(mergeRecommendations([], [])).toEqual([]);
  });

  it('returns the content-based items alone when there are no collaborative matches', () => {
    const content = [makeItem(1), makeItem(2)];

    const result = mergeRecommendations([], content);

    expect(result.map((item) => item.id)).toEqual([1, 2]);
  });
});