import { describe, expect, it } from 'vitest';
import { selectSpondGroupUrl } from './groupSettingsSelectors';

describe('group settings selectors', () => {
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
