import { describe, expect, it } from 'vitest';
import { selectIsSpondLinked, selectSpondGroupUrl } from './squadSettingsSelectors';

describe('squad settings selectors', () => {
  it('builds the Spond group URL for a linked squad', () => {
    expect(selectSpondGroupUrl({ spondId: 'group-123' }))
      .toBe('https://spond.com/client/groups/group-123');
  });

  it('escapes unexpected characters in a Spond group ID', () => {
    expect(selectSpondGroupUrl({ spondId: ' group/123 ' }))
      .toBe('https://spond.com/client/groups/group%2F123');
  });

  it.each([undefined, null, {}, { spondId: null }, { spondId: '' }, { spondId: '   ' }])(
    'falls back to no link when the squad has no Spond group (%j)',
    (squad) => {
      expect(selectSpondGroupUrl(squad)).toBeNull();
    },
  );
});

describe('selectIsSpondLinked', () => {
  it('is true for a squad with a Spond group', () => {
    expect(selectIsSpondLinked({ spondId: 'group-123' })).toBe(true);
    expect(selectIsSpondLinked({ spondId: ' group-123 ' })).toBe(true);
  });

  it.each([undefined, null, {}, { spondId: null }, { spondId: '' }, { spondId: '   ' }])(
    'is false when the squad has no Spond group (%j)',
    (squad) => {
      expect(selectIsSpondLinked(squad)).toBe(false);
    },
  );
});
