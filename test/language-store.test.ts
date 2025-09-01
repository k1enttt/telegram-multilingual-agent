import { describe, it, expect } from 'vitest';
import { InMemoryLanguageStore } from '../src/mastra/tools/language/language-store';

describe('InMemoryLanguageStore', () => {
  it('stores and retrieves language for a user', async () => {
    const store = new InMemoryLanguageStore('en');
    await store.set('user1', 'vi');
    const val = await store.get('user1');
    expect(val).toBe('vi');
  });

  it('returns default when not set via getOrDefault', async () => {
    const store = new InMemoryLanguageStore('en');
    const val = await store.getOrDefault('unknown');
    expect(val).toBe('en');
  });
});
