import { describe, expect, it } from 'vitest';

import { shouldPlayHomeHeroFilm, type HomeHeroFilmConditions } from './home-hero-film';

const eligible: HomeHeroFilmConditions = {
  automaticMotion: true,
  stillLoaded: true,
  inView: true,
  documentVisible: true,
  musicSession: false,
  manualPause: false,
  unavailable: false,
};

describe('home hero film', () => {
  it('plays only when every Home motion condition allows it', () => {
    expect(shouldPlayHomeHeroFilm(eligible)).toBe(true);
    expect(shouldPlayHomeHeroFilm({ ...eligible, automaticMotion: false })).toBe(false);
    expect(shouldPlayHomeHeroFilm({ ...eligible, stillLoaded: false })).toBe(false);
    expect(shouldPlayHomeHeroFilm({ ...eligible, inView: false })).toBe(false);
    expect(shouldPlayHomeHeroFilm({ ...eligible, documentVisible: false })).toBe(false);
    expect(shouldPlayHomeHeroFilm({ ...eligible, musicSession: true })).toBe(false);
    expect(shouldPlayHomeHeroFilm({ ...eligible, manualPause: true })).toBe(false);
    expect(shouldPlayHomeHeroFilm({ ...eligible, unavailable: true })).toBe(false);
  });
});
