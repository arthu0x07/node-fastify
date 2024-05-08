import { expect, it, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { describe } from 'node:test'

describe('Transaction Routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should be able to create a new transaction', async () => {
    const response = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 1000,
        type: 'credit',
      })
      .expect(201)

    expect(response.status).toEqual(201)
  })
})
