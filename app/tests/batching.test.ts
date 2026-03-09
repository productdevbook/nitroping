import { describe, expect, it } from 'vitest'
import { chunkArray } from '../server/utils/batching'

describe('chunkArray', () => {
  it('splits arrays into fixed-size chunks', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('rejects non-positive chunk sizes', () => {
    expect(() => chunkArray([1, 2, 3], 0)).toThrow('Chunk size must be greater than 0')
  })
})
