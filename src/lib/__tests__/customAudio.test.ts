import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateAudioFile,
  fileToDataUrl,
  saveCustomAudioFile,
  loadCustomAudioFile,
  deleteCustomAudioFile,
  type StoredAudioFile,
} from '../customAudio';

describe('customAudio engine', () => {
  beforeEach(async () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    await deleteCustomAudioFile('alarm');
  });

  describe('validateAudioFile', () => {
    it('accepts valid mp3, wav, and ogg files under 5MB', () => {
      const validMp3 = new File(['dummy audio content'], 'bell.mp3', { type: 'audio/mpeg' });
      const validWav = new File(['dummy audio content'], 'chime.wav', { type: 'audio/wav' });
      const validOgg = new File(['dummy audio content'], 'gong.ogg', { type: 'audio/ogg' });

      expect(validateAudioFile(validMp3).valid).toBe(true);
      expect(validateAudioFile(validWav).valid).toBe(true);
      expect(validateAudioFile(validOgg).valid).toBe(true);
    });

    it('accepts m4a and webm audio formats', () => {
      const validM4a = new File(['dummy content'], 'alert.m4a', { type: 'audio/x-m4a' });
      const validWebm = new File(['dummy content'], 'sound.webm', { type: 'audio/webm' });

      expect(validateAudioFile(validM4a).valid).toBe(true);
      expect(validateAudioFile(validWebm).valid).toBe(true);
    });

    it('rejects files exceeding 5MB limit', () => {
      const largeContent = new Uint8Array(5 * 1024 * 1024 + 1024);
      const largeFile = new File([largeContent], 'huge.mp3', { type: 'audio/mpeg' });

      const res = validateAudioFile(largeFile);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/5 MB/i);
    });

    it('rejects non-audio files (pdf, images, executables)', () => {
      const pdf = new File(['%PDF-1.4'], 'notes.pdf', { type: 'application/pdf' });
      const img = new File(['image bytes'], 'pic.png', { type: 'image/png' });

      expect(validateAudioFile(pdf).valid).toBe(false);
      expect(validateAudioFile(img).valid).toBe(false);
    });
  });

  describe('fileToDataUrl', () => {
    it('converts file blob to data url string', async () => {
      const file = new File(['audio sample'], 'test.mp3', { type: 'audio/mpeg' });
      const dataUrl = await fileToDataUrl(file);
      expect(dataUrl).toMatch(/^data:audio\/mpeg;base64,/);
    });
  });

  describe('storage lifecycle', () => {
    it('saves, loads, and deletes custom audio record', async () => {
      const sample: StoredAudioFile = {
        id: 'alarm',
        name: 'temple.mp3',
        sizeBytes: 1024,
        mimeType: 'audio/mpeg',
        durationSeconds: 2.5,
        dataUrl: 'data:audio/mpeg;base64,dGVzdA==',
        updatedAt: Date.now(),
      };

      await saveCustomAudioFile(sample);
      const loaded = await loadCustomAudioFile('alarm');
      expect(loaded).not.toBeNull();
      expect(loaded?.name).toBe('temple.mp3');
      expect(loaded?.durationSeconds).toBe(2.5);

      await deleteCustomAudioFile('alarm');
      const deleted = await loadCustomAudioFile('alarm');
      expect(deleted).toBeNull();
    });
  });
});
