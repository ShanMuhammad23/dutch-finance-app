'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { User } from '@/lib/types'

export interface CreateUserInput {
  full_name: string
  email: string
  password: string
  role: 'owner' | 'admin' | 'accountant' | 'bookkeeper'
}

export function useUsers() {
	return useQuery<User[]>({
		queryKey: ['users'],
		queryFn: async () => {
			const response = await fetch('/api/users')
			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Failed to fetch users')
			}
			return response.json()
		},
		staleTime: 1000 * 60 * 5,
	})
}

export function useCreateUser() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: ['create-user'],
		mutationFn: async (input: CreateUserInput): Promise<User> => {
			const response = await fetch('/api/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(input),
			})
			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Failed to create user')
			}
			const result = await response.json()
			return result.user
		},
		onSuccess: (newUser) => {
			// Optimistically add to cache
			queryClient.setQueryData<User[] | undefined>(
				['users'],
				(prev) => (prev ? [newUser, ...prev] : [newUser])
			)
		},
	})
}

export interface UpdateUserInput {
	id: number
	full_name?: string
	email?: string
	role?: 'owner' | 'admin' | 'accountant' | 'bookkeeper'
}

export function useUpdateUser() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: ['update-user'],
		mutationFn: async (input: UpdateUserInput): Promise<User> => {
			const { id, ...updateData } = input
			const response = await fetch(`/api/users/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updateData),
			})
			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Failed to update user')
			}
			const result = await response.json()
			return result.user
		},
		onSuccess: (updatedUser) => {
			// Update cache
			queryClient.setQueryData<User[] | undefined>(
				['users'],
				(prev) => prev?.map((u) => (u.id === updatedUser.id ? updatedUser : u))
			)
		},
	})
}

export function useDeleteUser() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: ['delete-user'],
		mutationFn: async (id: number): Promise<void> => {
			const response = await fetch(`/api/users/${id}`, {
				method: 'DELETE',
			})
			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Failed to delete user')
			}
		},
		onSuccess: (_, deletedId) => {
			// Remove from cache
			queryClient.setQueryData<User[] | undefined>(
				['users'],
				(prev) => prev?.filter((u) => u.id !== deletedId)
			)
		},
	})
}

