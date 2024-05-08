import { FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { knex } from '../database'
import { checkSessionIdExists } from '../middleware/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: checkSessionIdExists }, async (request, reply) => {
    const sessionId = request.cookies.sessionId

    if (!sessionId) {
      return reply.status(401).send({
        error: 'Unathorized',
      })
    }

    const transactions = await knex('transactions')
      .where('session_id', sessionId)
      .select()

    return {
      transactions,
    }
  })

  app.get('/:id', { preHandler: checkSessionIdExists }, async (request) => {
    const getTransactionParamSchema = z.object({ id: z.string().uuid() })

    const { id } = getTransactionParamSchema.parse(request.params)

    const sessionId = request.cookies.sessionId

    const transaction = knex('transactions')
      .where({ session_id: sessionId, id })
      .first()

    return transaction
  })

  app.get('/sumary', { preHandler: checkSessionIdExists }, async (request) => {
    const sessionId = request.cookies.sessionId

    const sumary = await knex('transactions')
      .where('session_id', sessionId)
      .sum('amount', { as: 'amount' })
      .first()

    return { sumary }
  })

  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
