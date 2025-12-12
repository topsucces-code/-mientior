/**
 * Become a Seller/Partner Page
 * Registration page for vendors who want to sell on Mientior marketplace
 */

import { Metadata } from 'next'
import { BecomeSellerClient } from './become-seller-client'

export const metadata: Metadata = {
  title: 'Devenir Partenaire/Vendeur | Mientior',
  description: 'Rejoignez la marketplace Mientior et vendez vos produits à des millions de clients en Afrique.',
}

export default function BecomeSellerPage() {
  return <BecomeSellerClient />
}
