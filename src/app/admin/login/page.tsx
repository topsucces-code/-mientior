import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth-admin'
import { AdminLoginForm } from '@/components/auth/admin-login-form'

export const metadata: Metadata = {
  title: 'Admin Login | Mientior',
  description: 'Sign in to the Mientior admin panel',
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>
}) {
  // Check if already logged in as admin
  const session = await getAdminSession()
  if (session) {
    const params = await searchParams
    redirect(params.redirectTo || '/admin')
  }

  const params = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the Mientior admin dashboard
          </p>
        </div>
        <div className="rounded-lg bg-white p-8 shadow-xl">
          <AdminLoginForm redirectTo={params.redirectTo} error={params.error} />
        </div>
        <p className="mt-4 text-center text-xs text-gray-500">
          This is a restricted area. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  )
}
