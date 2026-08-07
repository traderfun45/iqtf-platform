import { FastifyInstance } from 'fastify'
import {
  register,
  login,
  refreshAccessToken,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
} from '../services/auth.service'
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../utils/validation'
import { authenticate } from '../middleware/auth.middleware'

export async function authRoutes(app: FastifyInstance) {
  // ========================================
  // 1. REGISTER
  // ========================================
  app.post('/auth/register', async (request, reply) => {
    try {
      const input = registerSchema.parse(request.body)
      const result = await register(input)
      
      return reply.status(201).send({
        success: true,
        message: 'User registered successfully',
        data: result,
      })
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Registration failed',
      })
    }
  })

  // ========================================
  // 2. LOGIN
  // ========================================
  app.post('/auth/login', async (request, reply) => {
    try {
      const input = loginSchema.parse(request.body)
      const result = await login(input)
      
      return reply.send({
        success: true,
        message: 'Login successful',
        data: result,
      })
    } catch (error: any) {
      return reply.status(401).send({
        success: false,
        message: error.message || 'Login failed',
      })
    }
  })

  // ========================================
  // 3. REFRESH TOKEN
  // ========================================
  app.post('/auth/refresh', async (request, reply) => {
    try {
      const { refreshToken } = request.body as { refreshToken: string }
      if (!refreshToken) {
        return reply.status(400).send({
          success: false,
          message: 'Refresh token is required',
        })
      }

      const result = await refreshAccessToken(refreshToken)
      
      return reply.send({
        success: true,
        data: result,
      })
    } catch (error: any) {
      return reply.status(401).send({
        success: false,
        message: error.message || 'Refresh failed',
      })
    }
  })

  // ========================================
  // 4. LOGOUT
  // ========================================
  app.post('/auth/logout', async (request, reply) => {
    try {
      const { refreshToken } = request.body as { refreshToken: string }
      if (!refreshToken) {
        return reply.status(400).send({
          success: false,
          message: 'Refresh token is required',
        })
      }

      await logout(refreshToken)
      
      return reply.send({
        success: true,
        message: 'Logout successful',
      })
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Logout failed',
      })
    }
  })

  // ========================================
  // 5. CHANGE PASSWORD (Protected)
  // ========================================
  app.post('/auth/change-password', { preHandler: authenticate }, async (request, reply) => {
    try {
      const input = changePasswordSchema.parse(request.body)
      await changePassword(request.user!.userId, input)
      
      return reply.send({
        success: true,
        message: 'Password changed successfully',
      })
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Change password failed',
      })
    }
  })

  // ========================================
  // 6. FORGOT PASSWORD
  // ========================================
  app.post('/auth/forgot-password', async (request, reply) => {
    try {
      const input = forgotPasswordSchema.parse(request.body)
      await forgotPassword(input.email)
      
      return reply.send({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      })
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Request failed',
      })
    }
  })

  // ========================================
  // 7. RESET PASSWORD
  // ========================================
  app.post('/auth/reset-password', async (request, reply) => {
    try {
      const input = resetPasswordSchema.parse(request.body)
      await resetPassword(input.token, input.newPassword)
      
      return reply.send({
        success: true,
        message: 'Password reset successful',
      })
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Reset failed',
      })
    }
  })

  // ========================================
  // 8. GET USER PROFILE (Protected)
  // ========================================
  app.get('/auth/profile', { preHandler: authenticate }, async (request, reply) => {
    try {
      const user = await getUserProfile(request.user!.userId)
      
      return reply.send({
        success: true,
        data: { user },
      })
    } catch (error: any) {
      return reply.status(404).send({
        success: false,
        message: error.message || 'User not found',
      })
    }
  })

  // ========================================
  // 9. UPDATE USER PROFILE (Protected)
  // ========================================
  app.put('/auth/profile', { preHandler: authenticate }, async (request, reply) => {
    try {
      const input = updateProfileSchema.parse(request.body)
      const user = await updateUserProfile(request.user!.userId, input)
      
      return reply.send({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
      })
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Update failed',
      })
    }
  })
}
