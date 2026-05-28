import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'

import { API_PREFIX } from './constants/api'
import { env } from './config/env'
import { logger } from './config/logger'
import { swaggerSpec } from './swagger/swagger'
import { healthRouter } from './routes/health'
import { authRouter } from './routes/auth'
import { meRouter } from './routes/me'
import { accountPartyRouter } from './routes/accountParty'
import { mastersRouter } from './routes/masters'
import { bookingRouter } from './routes/booking'
import { statusRouter } from './routes/status'
import { reportsRouter } from './routes/reports'
import { usersRouter } from './routes/users'
import { platformRouter } from './routes/platform'
import { lookupRouter } from './routes/lookup'
import { billingRouter } from './routes/billing'
import { dashboardRouter } from './routes/dashboard'
import { notFound } from './middleware/notFound'
import { errorHandler } from './middleware/errorHandler'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  )
  app.use(helmet())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    }),
  )
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  )

  app.use(`${API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  app.use(API_PREFIX, healthRouter)
  app.use(API_PREFIX, authRouter)
  app.use(API_PREFIX, meRouter)
  app.use(API_PREFIX, accountPartyRouter)
  app.use(API_PREFIX, mastersRouter)
  app.use(API_PREFIX, bookingRouter)
  app.use(API_PREFIX, statusRouter)
  app.use(API_PREFIX, reportsRouter)
  app.use(API_PREFIX, billingRouter)
  app.use(API_PREFIX, dashboardRouter)
  app.use(API_PREFIX, usersRouter)
  app.use(API_PREFIX, platformRouter)
  app.use(API_PREFIX, lookupRouter)

  app.get('/', (_req, res) => {
    res.redirect(`${API_PREFIX}/docs`)
  })

  app.use(notFound)
  app.use(errorHandler)

  logger.info(`Configured app. PORT=${env.PORT}`)
  return app
}

