import { test, expect, vi } from 'vitest';
import { createErrorReporter } from './errorReporting';
// Vercel's runtime entry is plain JavaScript and intentionally dependency-free.
// @ts-expect-error JavaScript entry has no declaration file.
import { POST } from '../api/client-errors.js';

test('deduplicates categories and survives transport failures', () => {
  const send = vi.fn(() => {
    throw new Error('offline');
  });
  const report = createErrorReporter(send);
  report('graphics-context');
  report('graphics-context');
  report('runtime-error');
  expect(send.mock.calls).toEqual([['graphics-context'], ['runtime-error']]);
});

test('rejects foreign origins, oversized input, arbitrary messages and extra fields', async () => {
  const request = (body: string, origin = 'https://lab.example') =>
    new Request('https://lab.example/api/client-errors', {
      method: 'POST',
      headers: { origin, 'Content-Type': 'application/json' },
      body,
    });
  expect((await POST(request('{"code":"runtime-error"}', 'https://other.example'))).status).toBe(
    403,
  );
  expect((await POST(request('x'.repeat(257)))).status).toBe(413);
  expect((await POST(request('{"code":"private project name"}'))).status).toBe(400);
  expect((await POST(request('{"code":"runtime-error","project":"private"}'))).status).toBe(400);
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    expect((await POST(request('{"code":"graphics-context"}'))).status).toBe(204);
    expect(JSON.parse(log.mock.calls[0][0])).toEqual({
      event: 'lab-client-failure',
      code: 'graphics-context',
      release: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    });
  } finally {
    log.mockRestore();
  }
});
