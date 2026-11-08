import { describe, it, expect } from 'vitest';
import { validateAudioFile, ALLOWED_EXTENSIONS, MAX_AUDIO_BYTES } from '../customAudio';

describe('customAudio validation', () => {
  it('accepts common audio extensions', () => {
    for (const ext of ['.mp3', '.wav', '.ogg', '.m4a']) {
      expect(validateAudioFile({ name: `x${ext}`, type: '', size: 1000 })).toBeNull();
    }
  });
  it('rejects bad extensions and types', () => {
    expect(validateAudioFile({ name: 'x.exe', type: 'application/x-msdownload', size: 100 })).toBe('bad-type');
    expect(validateAudioFile({ name: 'x.txt', type: 'text/plain', size: 100 })).toBe('bad-type');
  });
  it('rejects empty and oversized files', () => {
    expect(validateAudioFile({ name: 'a.mp3', type: 'audio/mpeg', size: 0 })).toBe('empty');
    expect(validateAudioFile({ name: 'a.mp3', type: 'audio/mpeg', size: MAX_AUDIO_BYTES + 1 })).toBe('too-large');
  });
});
