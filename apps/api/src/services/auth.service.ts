import { PrismaClient } from '@prisma/client'
import { hashPassword, comparePassword } from '../utils/bcrypt'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../utils/jwt'
import { sendEmail, generateResetPasswordHTML } from '../utils/email'
import { RegisterInput, LoginInput, ChangePasswordInput } from '../utils/validation'

const prisma = new PrismaClient()

// ========================================
// 1. REGISTER
// ========================================
export const register = async (input: RegisterInput) => {
  const { email, password, name } = input

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    throw new Error('Email already registered')
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || null,
      isVerified: false,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  })

  // Generate tokens
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }

  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  // Save session
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  })

  return {
    user,
    accessToken,
    refreshToken,
  }
}

// ========================================
// 2. LOGIN
// ========================================
export const login = async (input: LoginInput) => {
  const { email, password } = input

  // Find user
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new Error('Invalid email or password')
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Account is deactivated')
  }

  // Verify password
  const isValid = await comparePassword(password, user.password)
  if (!isValid) {
    throw new Error('Invalid email or password')
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  // Generate tokens
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }

  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  // Save session
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
    },
    accessToken,
    refreshToken,
  }
}

// ========================================
// 3. REFRESH TOKEN
// ========================================
export const refreshAccessToken = async (refreshToken: string) => {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken)

  // Check if session exists and not revoked
  const session = await prisma.session.findFirst({
    where: {
      refreshToken,
      userId: payload.userId,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
  })

  if (!session) {
    throw new Error('Invalid or expired refresh token')
  }

  // Generate new access token
  const newPayload: TokenPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  }

  const newAccessToken = generateAccessToken(newPayload)

  return { accessToken: newAccessToken }
}

// ========================================
// 4. LOGOUT
// ========================================
export const logout = async (refreshToken: string) => {
  // Revoke session
  await prisma.session.updateMany({
    where: { refreshToken },
    data: { revoked: true },
  })

  return { success: true }
}

// ========================================
// 5. CHANGE PASSWORD
// ========================================
export const changePassword = async (userId: string, input: ChangePasswordInput) => {
  const { currentPassword, newPassword } = input

  // Get user
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error('User not found')
  }

  // Verify current password
  const isValid = await comparePassword(currentPassword, user.password)
  if (!isValid) {
    throw new Error('Current password is incorrect')
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword)

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  })

  // Revoke all sessions (force re-login)
  await prisma.session.updateMany({
    where: { userId },
    data: { revoked: true },
  })

  return { success: true }
}

// ========================================
// 6. FORGOT PASSWORD
// ========================================
export const forgotPassword = async (email: string) => {
  // Find user
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    // Don't reveal if user exists or not (security)
    return { success: true }
  }

  // Generate reset token (using crypto)
  const crypto = await import('crypto')
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  // Save reset token
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  })

  // Send email
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`
  const html = generateResetPasswordHTML(resetLink)
  await sendEmail(email, 'Reset Your Password - IQTF Platform', html)

  return { success: true }
}

// ========================================
// 7. RESET PASSWORD (with token)
// ========================================
export const resetPassword = async (token: string, newPassword: string) => {
  // Find valid reset token
  const resetRequest = await prisma.passwordReset.findFirst({
    where: {
      token,
      used: false,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  })

  if (!resetRequest) {
    throw new Error('Invalid or expired reset token')
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword)

  // Update user password
  await prisma.user.update({
    where: { id: resetRequest.userId },
    data: { password: hashedPassword },
  })

  // Mark token as used
  await prisma.passwordReset.update({
    where: { id: resetRequest.id },
    data: { used: true },
  })

  // Revoke all sessions
  await prisma.session.updateMany({
    where: { userId: resetRequest.userId },
    data: { revoked: true },
  })

  return { success: true }
}

// ========================================
// 8. GET USER PROFILE
// ========================================
export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isVerified: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user
}

// ========================================
// 9. UPDATE USER PROFILE
// ========================================
export const updateUserProfile = async (userId: string, data: { name?: string; email?: string }) => {
  // If email is being updated, check if it's already taken
  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: { id: userId },
      },
    })
    if (existing) {
      throw new Error('Email already in use')
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isVerified: true,
      isActive: true,
      lastLoginAt: true,
      updatedAt: true,
    },
  })

  return user
}
