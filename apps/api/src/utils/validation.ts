import { z } from 'zod'

// ===== Register Validation =====
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>

// ===== Login Validation =====
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>

// ===== Change Password Validation =====
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// ===== Forgot Password Validation =====
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

// ===== Reset Password Validation =====
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

// ===== Update Profile Validation =====
export const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
