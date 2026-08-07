import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken, TokenPayload } from '../utils/jwt'

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload
  }
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        message: 'Authentication required',
      })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyAccessToken(token)

    request.user = payload
  } catch (error) {
    return reply.status(401).send({
      success: false,
      message: 'Invalid or expired token',
    })
  }
}

export const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  await authenticate(request, reply)
  
  if (request.user?.role !== 'ADMIN') {
    return reply.status(403).send({
      success: false,
      message: 'Admin access required',
    })
  }
}
