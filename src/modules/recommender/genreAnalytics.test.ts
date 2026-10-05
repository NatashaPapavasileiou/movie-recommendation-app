import { describe, it, expect } from 'vitest';
import { extractTopGenres, toTvGenreIds } from './genreAnalytics';

describe('toTvGenreIds', () => {
  it('maps movie genres to their TV equivalents', () => {
    // Action -> Action & Adventure, Science Fiction -> Sci-Fi & Fantasy, War -> War & Politics
    expect(toTvGenreIds([28, 878, 10752])).toEqual([10759, 10765, 10768]);
  });

  it('keeps genres that TMDB uses for both movies and TV', () => {
    // Comedy, Drama, Crime
    expect(toTvGenreIds([35, 18, 80])).toEqual([35, 18, 80]);
  });

  it('drops movie-only genres that have no TV equivalent', () => {
    // Horror, Thriller, Romance
    expect(toTvGenreIds([27, 53, 10749])).toEqual([]);
  });

  it('removes duplicates created by the mapping', () => {
    // Action and Adventure both become Action & Adventure
    expect(toTvGenreIds([28, 12])).toEqual([10759]);
  });
});

describe('extractTopGenres', () => {
  it('returns the most frequent genres first', () => {
    const items = [
      { id: 1, genre_ids: [18, 80] },
      { id: 2, genre_ids: [18, 53] },
      { id: 3, genres: [{ id: 18 }, { id: 80 }] },
    ];
    expect(extractTopGenres(items, 2)).toEqual([18, 80]);
  });

  it('returns an empty list when the items carry no genre information', () => {
    expect(extractTopGenres([{ id: 1 }, { id: 2 }])).toEqual([]);
  });
});
