import { describe, expect, test } from 'vitest';
import { matchesHotkey } from './useHotkey';

function keyEvent(init: KeyboardEventInit): KeyboardEvent {
  return new KeyboardEvent('keydown', init);
}

describe('matchesHotkey', () => {
  describe('when the exact combination is pressed', () => {
    test('matches', () => {
      const event = keyEvent({ key: 'N', ctrlKey: true, shiftKey: true });

      const result = matchesHotkey(event, 'ctrl+shift+n');

      expect(result).toBe(true);
    });
  });

  describe('when a required modifier is missing', () => {
    test('does not match', () => {
      const event = keyEvent({ key: 'N', shiftKey: true });

      const result = matchesHotkey(event, 'ctrl+shift+n');

      expect(result).toBe(false);
    });
  });

  describe('when an extra modifier is held', () => {
    test('does not match', () => {
      const event = keyEvent({ key: 'N', ctrlKey: true, shiftKey: true, altKey: true });

      const result = matchesHotkey(event, 'ctrl+shift+n');

      expect(result).toBe(false);
    });
  });

  describe('when the key differs', () => {
    test('does not match', () => {
      const event = keyEvent({ key: 'M', ctrlKey: true, shiftKey: true });

      const result = matchesHotkey(event, 'ctrl+shift+n');

      expect(result).toBe(false);
    });
  });
});
