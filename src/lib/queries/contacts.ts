'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Contact, CreateContactInput, UpdateContactInput } from '@/lib/types'

export function useOrganizationContacts(organizationId?: number) {
	return useQuery<Contact[]>({
		queryKey: ['contacts', organizationId],
		queryFn: async () => {
			if (!organizationId) {
				throw new Error('Organization ID is required')
			}
			const response = await fetch(`/api/contacts?organizationId=${organizationId}`)
			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Failed to fetch contacts')
			}
			return response.json()
		},
		enabled: !!organizationId,
		staleTime: 1000 * 60 * 5,
	})
}

export function useCreateContact(organizationId?: number) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: ['create-contact', organizationId],
		mutationFn: async (input: CreateContactInput): Promise<Contact> => {
			if (!organizationId) {
				throw new Error('Organization ID is required')
			}
			const response = await fetch('/api/contacts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(input),
			})
			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Failed to create contact')
			}
			return response.json()
		},
		onSuccess: (newContact) => {
			if (!organizationId) return
			// Optimistically add to cache for the organization
			queryClient.setQueryData<Contact[] | undefined>(
				['contacts', organizationId],
				(prev) => (prev ? [...prev, newContact] : [newContact])
			)
		},
	})
}

export function useUpdateContact(organizationId?: number) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: ['update-contact', organizationId],
		mutationFn: async (input: UpdateContactInput): Promise<Contact> => {
			const { id, ...updates } = input
			const response = await fetch(`/api/contacts/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates),
			})
			if (!response.ok) {
				const error = await response.json().catch(() => ({}))
				throw new Error(error.error || 'Failed to update contact')
			}
			return response.json()
		},
		onMutate: async (input) => {
			if (!organizationId) return { previous: undefined as Contact[] | undefined }
			await queryClient.cancelQueries({ queryKey: ['contacts', organizationId] })
			const previous = queryClient.getQueryData<Contact[]>(['contacts', organizationId])
			queryClient.setQueryData<Contact[] | undefined>(['contacts', organizationId], (old) => {
				if (!old) return old
				return old.map((c) => (c.id === input.id ? { ...c, ...input } as Contact : c))
			})
			return { previous }
		},
		onError: (_err, _vars, context) => {
			if (organizationId && context?.previous) {
				queryClient.setQueryData(['contacts', organizationId], context.previous)
			}
		},
		onSuccess: (updated) => {
			if (!organizationId) return
			queryClient.setQueryData<Contact[] | undefined>(['contacts', organizationId], (old) => {
				if (!old) return old
				return old.map((c) => (c.id === updated.id ? updated : c))
			})
		},
	})
}

export function useDeleteContact(organizationId?: number) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: ['delete-contact', organizationId],
		mutationFn: async (id: number): Promise<{ id: number }> => {
			const response = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
			if (!response.ok) {
				const error = await response.json().catch(() => ({}))
				throw new Error(error.error || 'Failed to delete contact')
			}
			return { id }
		},
		onMutate: async (id) => {
			if (!organizationId) return { previous: undefined as Contact[] | undefined }
			await queryClient.cancelQueries({ queryKey: ['contacts', organizationId] })
			const previous = queryClient.getQueryData<Contact[]>(['contacts', organizationId])
			queryClient.setQueryData<Contact[] | undefined>(['contacts', organizationId], (old) => {
				if (!old) return old
				return old.filter((c) => c.id !== id)
			})
			return { previous }
		},
		onError: (_err, _vars, context) => {
			if (organizationId && context?.previous) {
				queryClient.setQueryData(['contacts', organizationId], context.previous)
			}
		},
	})
}
