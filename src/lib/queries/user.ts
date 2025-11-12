import { supabase } from "../supabase";
import { User } from "../types";

export async function getUser(userId?: number): Promise<User | null> {
  if (!userId) {
    console.error('No user ID provided')
    return null
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching user:', error)
    return null
  }
  
  return data
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error) {
    console.error('Error fetching user by email:', error)
    return null
  }
  
  return data
}

export interface SignupInput {
  full_name: string
  email: string
  password: string
}

export async function signupUser(userData: SignupInput): Promise<User> {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create user')
  }

  return result.user
}

// TanStack Query hooks
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useSignupMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: signupUser,
    onSuccess: (data) => {
      // Invalidate and refetch user queries
      queryClient.invalidateQueries({ queryKey: ['users'] })
      console.log('User created successfully:', data)
    },
    onError: (error) => {
      console.error('Signup failed:', error)
    }
  })
}

// Login mutation hook
export interface LoginInput {
  email: string
  password: string
}

export async function loginUser(credentials: LoginInput): Promise<User> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Invalid credentials')
  }

  return result.user
}

export function useLoginMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // Invalidate and refetch user queries
      queryClient.invalidateQueries({ queryKey: ['users'] })
      console.log('User logged in successfully:', data)
    },
    onError: (error) => {
      console.error('Login failed:', error)
    }
  })
}