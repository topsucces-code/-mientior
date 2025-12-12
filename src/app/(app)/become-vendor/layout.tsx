import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Devenir vendeur | Mientior',
  description: 'Rejoignez notre marketplace et vendez vos produits à des millions de clients à travers l\'Afrique',
}

export default function BecomeVendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
