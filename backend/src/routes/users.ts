import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { createUser, listUsers } from '../controllers/usersController'

export const usersRouter = Router()

usersRouter.use(requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']))

usersRouter.get('/users', listUsers)
usersRouter.post('/users', createUser)
