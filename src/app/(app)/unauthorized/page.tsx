import { Metadata } from 'next'
import Link from 'next/link'
import { ShieldX, ArrowLeft, Store, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Accès non autorisé | Mientior',
  description: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page',
}

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const params = await searchParams
  const reason = params.reason

  const getMessage = () => {
    switch (reason) {
      case 'vendor_required':
        return {
          title: 'Accès réservé aux vendeurs',
          description: 'Cette section est réservée aux vendeurs. Vous devez avoir un compte vendeur pour y accéder.',
          action: 'Devenir vendeur',
          actionHref: '/become-vendor',
          icon: Store,
        }
      case 'auth_required':
        return {
          title: 'Connexion requise',
          description: 'Vous devez être connecté pour accéder à cette page.',
          action: 'Se connecter',
          actionHref: '/login',
          icon: User,
        }
      default:
        return {
          title: 'Accès non autorisé',
          description: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.',
          action: 'Retour à l\'accueil',
          actionHref: '/',
          icon: ShieldX,
        }
    }
  }

  const message = getMessage()
  const Icon = message.icon

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-12">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <Icon className="h-12 w-12 text-red-600" />
          </div>
        </div>
        
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          {message.title}
        </h1>
        
        <p className="mb-8 text-gray-600">
          {message.description}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="default" className="bg-turquoise-600 hover:bg-turquoise-700">
            <Link href={message.actionHref}>
              {message.action}
            </Link>
          </Button>
          
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
