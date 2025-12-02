import { Metadata } from 'next'
import HelpClient from './help-client'

export const metadata: Metadata = {
  title: 'Aide & FAQ | Mientior',
  description: 'Trouvez des réponses à vos questions sur Mientior. FAQ, contact et support client.',
}

export default function HelpPage() {
  return <HelpClient />
}
