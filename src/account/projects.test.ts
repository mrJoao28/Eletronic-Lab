import { test, expect } from 'vitest';
import { parseCloudProject } from './projects';
import { example } from '../examples';
const owner = '11111111-1111-4111-8111-111111111111';
const row = {
  id: '22222222-2222-4222-8222-222222222222',
  owner_id: owner,
  name: example('rc').name,
  document: example('rc'),
  updated_at: '2026-11-13T00:00:00Z',
  archived: false,
};
test('accepts a validated project only for its authenticated owner', () => {
  expect(parseCloudProject(row, owner).project.parts.length).toBeGreaterThan(0);
  expect(() => parseCloudProject(row, '33333333-3333-4333-8333-333333333333')).toThrow();
});
test('rejects malformed project documents and inconsistent names', () => {
  expect(() => parseCloudProject({ ...row, name: 'Other' }, owner)).toThrow();
  expect(() => parseCloudProject({ ...row, document: { version: 7 } }, owner)).toThrow();
  expect(() => parseCloudProject({ ...row, updated_at: 'bad date' }, owner)).toThrow();
});
