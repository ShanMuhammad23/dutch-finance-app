import NextAuth, { type NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { supabase } from "@/lib/supabase"
import { comparePassword } from "@/lib/auth"
import type { JWT } from "next-auth/jwt"
import type { Session, User } from "next-auth"

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
    }
  }
  
  interface User {
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
  }
}

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔐 Auth attempt:', { email: credentials?.email, passwordLength: (credentials?.password as string)?.length })

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('id, full_name, email, role, password')
            .eq('email', credentials.email)
            .single()

          if (profileError) {
            console.log('❌ Database error:', profileError.message)
            return null
          }

          if (!userProfile) {
            console.log('❌ User not found')
            return null
          }

          console.log('👤 User found:', { id: userProfile.id, email: userProfile.email })
          console.log('🔑 Stored password format:', userProfile.password.startsWith('$2b$') ? 'Hashed (bcrypt)' : 'Plain text')

          // Check if password is hashed (starts with $2b$) or plain text
          let isPasswordValid = false
          
          if (userProfile.password.startsWith('$2b$')) {
            // Password is hashed, use bcrypt comparison
            console.log('🔐 Comparing with bcrypt...')
            isPasswordValid = await comparePassword(credentials.password as string, userProfile.password)
          } else {
            // Password is plain text (legacy), compare directly
            console.log('🔐 Comparing plain text passwords...')
            isPasswordValid = credentials.password as string === userProfile.password
          }
          
          if (!isPasswordValid) {
            console.error('❌ Password mismatch')
            return null
          }

          console.log('✅ Password valid, creating session')
          return {
            id: userProfile.id.toString(),
            email: userProfile.email,
            name: userProfile.full_name,
            role: userProfile.role,
            // organizationId will be fetched separately if needed
          }
        } catch (error) {
          console.error('❌ Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: User | undefined }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.sub || ''
        session.user.role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const { handlers } = NextAuth(authOptions)

export const { GET, POST } = handlers
