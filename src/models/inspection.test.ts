import { describe, it, expect } from 'vitest';
import { createHardwareModel } from './hardware';
import { inspectModel } from './inspection';
describe('Inspeção desmontável', () => {
  it('separa conjuntos sem acumular deslocamento e pode remontar', () => {
    const model = createHardwareModel('pi4');
    inspectModel(model, 1, []);
    expect(model.getObjectByName('processor')!.position.y).toBe(7);
    inspectModel(model, 0.5, []);
    expect(model.getObjectByName('processor')!.position.y).toBe(3.5);
    inspectModel(model, 0, []);
    expect(model.getObjectByName('processor')!.position.y).toBe(0);
  });
  it('oculta apenas o conjunto selecionado e restaura visibilidade', () => {
    const model = createHardwareModel('pi4');
    inspectModel(model, 0, ['ports']);
    expect(model.getObjectByName('ports')!.visible).toBe(false);
    expect(model.getObjectByName('processor')!.visible).toBe(true);
    inspectModel(model, 0, []);
    expect(model.getObjectByName('ports')!.visible).toBe(true);
  });
});
