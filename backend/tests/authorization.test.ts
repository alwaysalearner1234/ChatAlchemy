import { describe, expect, it } from 'vitest';
import { isAuthorizedController } from '../src/authorization.js';

describe('Twitch control authorization', () => {
  const streamer = 'channel_owner';
  const moderators = ['trusted_mod'];

  it('accepts the configured broadcaster only with broadcaster role metadata', () => {
    expect(isAuthorizedController(streamer, { broadcaster: true, moderator: false }, streamer, moderators)).toBe(true);
    expect(isAuthorizedController(streamer, { broadcaster: false, moderator: false }, streamer, moderators)).toBe(false);
  });
  it('accepts a configured moderator only with Twitch moderator metadata', () => {
    expect(isAuthorizedController('TRUSTED_MOD', { broadcaster: false, moderator: true }, streamer, moderators)).toBe(true);
    expect(isAuthorizedController('trusted_mod', { broadcaster: false, moderator: false }, streamer, moderators)).toBe(false);
  });
  it('rejects an ordinary viewer and missing identity', () => {
    expect(isAuthorizedController('viewer', { broadcaster: false, moderator: false }, streamer, moderators)).toBe(false);
    expect(isAuthorizedController(undefined, { broadcaster: true, moderator: true }, streamer, moderators)).toBe(false);
  });
});
