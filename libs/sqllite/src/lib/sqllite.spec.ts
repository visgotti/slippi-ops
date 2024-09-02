import { sqllite } from './sqllite';
import { describe, it, expect } from 'vitest';

describe('sqllite', () => {
  it('should work', () => {
    expect(sqllite()).toEqual('sqllite');
  });
});
