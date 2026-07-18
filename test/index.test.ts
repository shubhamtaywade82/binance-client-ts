import { describe, expect, it } from 'vitest';
import { VERSION } from '../src/index.js';

describe('index', () => {
  it('exports a semver VERSION string', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
