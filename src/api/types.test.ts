import { describe, it, expect } from 'vitest'
import { ApiError, isApiError, isApiResponse } from './types'

describe('ApiError', () => {
  it('creates error with message', () => {
    const err = new ApiError('Test error')
    expect(err.message).toBe('Test error')
    expect(err.name).toBe('ApiError')
  })

  it('attaches response, code, and data', () => {
    const err = new ApiError('Bad request', {
      code: 10001,
      data: { code: 10001, message: 'Bad', data: null },
    })
    expect(err.code).toBe(10001)
    expect(err.data?.message).toBe('Bad')
  })

  it('is instance of Error', () => {
    const err = new ApiError('Test')
    expect(err instanceof Error).toBe(true)
    expect(err instanceof ApiError).toBe(true)
  })
})

describe('Type Guards', () => {
  it('isApiError identifies ApiError', () => {
    expect(isApiError(new ApiError('test'))).toBe(true)
    expect(isApiError(new Error('plain'))).toBe(false)
    expect(isApiError('string')).toBe(false)
    expect(isApiError(null)).toBe(false)
  })

  it('isApiResponse identifies valid response', () => {
    expect(isApiResponse({ code: 200, message: 'ok', data: {} })).toBe(true)
    expect(isApiResponse({ code: 200, message: 'ok' })).toBe(true)
    expect(isApiResponse({ code: 200 })).toBe(false)
    expect(isApiResponse(null)).toBe(false)
    expect(isApiResponse('string')).toBe(false)
  })
})