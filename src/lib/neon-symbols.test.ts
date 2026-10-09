import { Color } from 'three';
import { describe, expect, it } from 'vitest';
import { commandsToContours, emissiveFor } from './neon-renderer';
import { NEON_SYMBOLS, SYMBOL_CHARACTERS, segmentLine, symbolFor } from './neon-symbols';

describe('segmentLine', () => {
  it('turns emojis into neon symbols and keeps the words exact', () => {
    const { segments, unsupported } = segmentLine('Rahul ❤️ Priya');
    expect(segments.map((s) => [s.kind, s.kind === 'symbol' ? s.symbol!.id : s.text])).toEqual([
      ['text', 'Rahul '],
      ['symbol', 'heart'],
      ['text', ' Priya'],
    ]);
    expect(unsupported).toEqual([]);
  });

  it('handles several symbols in a row and typed symbols', () => {
    const ids = segmentLine('♾️🌹★☾♪').segments.map((s) => s.symbol?.id);
    expect(ids).toEqual(['infinity', 'rose', 'star', 'moon', 'music']);
  });

  it('reports emojis that have no neon version instead of drawing a box', () => {
    const { segments, unsupported } = segmentLine('Ananya 🦄!');
    expect(unsupported).toEqual(['🦄']);
    expect(segments.map((s) => s.text).join('')).toBe('Ananya !');
  });

  it('drops invisible variation selectors from the words', () => {
    expect(segmentLine('A️B').segments).toEqual([{ kind: 'text', text: 'AB' }]);
  });
});

describe('symbol picker', () => {
  it('offers a character for every symbol, and each one maps back to it', () => {
    expect(Object.keys(SYMBOL_CHARACTERS).sort()).toEqual(NEON_SYMBOLS.map((s) => s.id).sort());
    for (const [id, character] of Object.entries(SYMBOL_CHARACTERS)) {
      expect(symbolFor(character)?.id).toBe(id);
    }
  });
});

describe('commandsToContours', () => {
  it('samples curves and closes outlines', () => {
    const contours = commandsToContours([
      { type: 'M', x: 0, y: 0 },
      { type: 'L', x: 10, y: 0 },
      { type: 'Q', x1: 15, y1: 5, x: 10, y: 10 },
      { type: 'Z' },
      { type: 'M', x: 20, y: 0 },
      { type: 'C', x1: 25, y1: 0, x2: 30, y2: 5, x: 30, y: 10 },
    ]);
    expect(contours).toHaveLength(2);
    expect(contours[0]!.closed).toBe(true);
    expect(contours[0]!.points).toHaveLength(2 + 8);
    expect(contours[1]!.closed).toBe(false);
    expect(contours[1]!.points.at(-1)!.toArray()).toEqual([30, 10]);
  });
});

describe('emissiveFor', () => {
  it('pushes deep colours harder than bright ones so all read equally lit', () => {
    const pink = emissiveFor(new Color('#ff2e88'));
    const cyan = emissiveFor(new Color('#22d3ee'));
    expect(pink).toBeGreaterThan(cyan);
    expect(emissiveFor(new Color('#000010'))).toBeLessThanOrEqual(3.2);
    expect(emissiveFor(new Color('#ffffff'))).toBeGreaterThanOrEqual(0.8);
  });
});
