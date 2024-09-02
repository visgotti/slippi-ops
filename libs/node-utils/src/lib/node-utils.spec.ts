import { nodeUtils } from './node-utils';
import { describe, it, expect } from 'vitest';

describe('nodeUtils', () => {
  it('should work', () => {
    expect(nodeUtils()).toEqual('node-utils');
  });
});
