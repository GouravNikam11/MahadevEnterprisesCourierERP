import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { getTimeline, updateStatus } from '../controllers/statusController'

export const statusRouter = Router()

statusRouter.use(requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'STAFF']))

statusRouter.post('/status', updateStatus)
statusRouter.get('/status/timeline', getTimeline)

