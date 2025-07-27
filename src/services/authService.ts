import { supabase } from '../lib/supabase'
import { User } from '../types'
import bcrypt from 'bcryptjs'

export interface AuthResponse {
  success: boolean
  user?: User
  error?: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
  is_admin: boolean
}

export interface LoginData {
  email: string
  password: string
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Verificar si el usuario ya existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email)
        .single()

      if (existingUser) {
        return {
          success: false,
          error: 'El email ya está en uso'
        }
      }

      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(data.password, 10)

      // Crear usuario en la base de datos
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: data.email,
          name: data.username,
          password: passwordHash,
          balance: 0,
          role: data.is_admin ? 'admin' : 'user'
        })
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: 'Error al crear la cuenta: ' + error.message
        }
      }

      const user: User = {
        id: newUser.id,
        email: newUser.email,
        username: newUser.name,
        balance: newUser.balance,
        is_admin: newUser.role === 'admin',
        createdAt: newUser.created_at
      }

      return {
        success: true,
        user
      }
    } catch {
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      // Buscar usuario por email
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.email)
        .single()

      if (error || !userData) {
        return {
          success: false,
          error: 'Email o contraseña incorrectos'
        }
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(data.password, userData.password)

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Email o contraseña incorrectos'
        }
      }

      const user: User = {
        id: userData.id,
        email: userData.email,
        username: userData.name,
        balance: userData.balance,
        is_admin: userData.role === 'admin',
        createdAt: userData.created_at
      }

      return {
        success: true,
        user
      }
    } catch {
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  async updateUserBalance(userId: string, newBalance: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId)

      return !error
    } catch {
      return false
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !data) {
        return null
      }

      return {
        id: data.id,
        email: data.email,
        username: data.name,
        balance: data.balance,
        is_admin: data.role === 'admin',
        createdAt: data.created_at
      }
    } catch {
      return null
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error || !data) {
        return []
      }

      return data.map(user => ({
        id: user.id,
        email: user.email,
        username: user.name,
        balance: user.balance,
        is_admin: user.role === 'admin',
        createdAt: user.created_at
      }))
    } catch {
      return []
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      return !error
    } catch {
      return false
    }
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const passwordHash = await bcrypt.hash(newPassword, 10)
      
      const { error } = await supabase
        .from('users')
        .update({ password: passwordHash })
        .eq('id', userId)

      return !error
    } catch {
      return false
    }
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<boolean> {
    try {
      // Mapear campos del modelo User a campos de la base de datos
      const dbUpdates: Record<string, unknown> = {}
      
      if (updates.email) dbUpdates.email = updates.email
      if (updates.username) dbUpdates.name = updates.username
      if (updates.balance !== undefined) dbUpdates.balance = updates.balance
      if (updates.is_admin !== undefined) dbUpdates.role = updates.is_admin ? 'admin' : 'user'
      
      const { error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', userId)

      return !error
    } catch {
      return false
    }
  }

  async createAdminUser(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Verificar si el usuario ya existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single()

      if (existingUser) {
        return {
          success: false,
          error: 'El email o nombre de usuario ya está en uso'
        }
      }

      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(userData.password, 10)

      // Crear usuario administrador
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          name: userData.username,
          password: passwordHash,
          balance: 0,
          role: userData.is_admin ? 'admin' : 'user'
        })
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: 'Error al crear la cuenta de administrador: ' + error.message
        }
      }

      const user: User = {
        id: newUser.id,
        email: newUser.email,
        username: newUser.name,
        balance: newUser.balance,
        is_admin: newUser.role === 'admin',
        createdAt: newUser.created_at
      }

      return {
        success: true,
        user
      }
    } catch {
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }
}

export const authService = new AuthService()