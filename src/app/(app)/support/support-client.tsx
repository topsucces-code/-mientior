'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Search,
  Filter,
  HelpCircle,
  Package,
  CreditCard,
  Truck,
  RefreshCw,
  User,
  Settings,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupportClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

// Ticket type for display
interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  messages: { id: string; createdAt: string }[];
}

// Category icons
const categoryIcons: Record<string, React.ElementType> = {
  ORDER_ISSUE: Package,
  PAYMENT_ISSUE: CreditCard,
  DELIVERY_ISSUE: Truck,
  PRODUCT_QUESTION: HelpCircle,
  RETURN_REFUND: RefreshCw,
  ACCOUNT_ISSUE: User,
  VENDOR_ISSUE: MessageCircle,
  TECHNICAL_ISSUE: Settings,
  OTHER: MessageSquare,
};

// Status colors
const statusColors: Record<string, string> = {
  OPEN: 'bg-emerald-100 text-emerald-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  WAITING_CUSTOMER: 'bg-amber-100 text-amber-700',
  WAITING_VENDOR: 'bg-taupe-100 text-taupe-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
};

// Status labels
const statusLabels: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  WAITING_CUSTOMER: 'En attente',
  WAITING_VENDOR: 'En attente vendeur',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
};

// Category labels
const categoryLabels: Record<string, string> = {
  ORDER_ISSUE: 'Commande',
  PAYMENT_ISSUE: 'Paiement',
  DELIVERY_ISSUE: 'Livraison',
  PRODUCT_QUESTION: 'Produit',
  RETURN_REFUND: 'Retour',
  ACCOUNT_ISSUE: 'Compte',
  VENDOR_ISSUE: 'Vendeur',
  TECHNICAL_ISSUE: 'Technique',
  OTHER: 'Autre',
};

export default function SupportClient({ user }: SupportClientProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('/api/support/tickets');
        if (response.ok) {
          const data = await response.json();
          setTickets(data);
        }
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // Filter tickets based on search and active filter
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || ticket.status === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Handle new ticket form submission
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: newTicket.subject,
          category: newTicket.category,
          message: newTicket.message,
        }),
      });

      if (response.ok) {
        const newTicketData = await response.json();
        setTickets([newTicketData, ...tickets]);
        setNewTicket({ subject: '', category: '', message: '' });
        setShowNewTicketForm(false);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support client</h1>
          <p className="text-gray-600 mt-2">
            Consultez vos tickets ou créez-en un nouveau pour obtenir de l'aide
          </p>
        </div>
        <button
          onClick={() => setShowNewTicketForm(true)}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Nouveau ticket
        </button>
      </div>

      {showNewTicketForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Nouveau ticket de support</h2>
            <button
              onClick={() => setShowNewTicketForm(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Fermer</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmitTicket}>
            <div className="space-y-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Objet
                </label>
                <input
                  type="text"
                  id="subject"
                  required
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Décrivez brièvement votre problème"
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Catégorie
                </label>
                <select
                  id="category"
                  required
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Détails
                </label>
                <div className="mt-1">
                  <textarea
                    id="message"
                    rows={4}
                    required
                    value={newTicket.message}
                    onChange={(e) => setNewTicket({...newTicket, message: e.target.value})}
                    className="shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Décrivez votre problème en détail..."
                    defaultValue={''}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Décrivez votre problème avec le plus de détails possible pour une résolution plus rapide.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTicketForm(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="relative rounded-md shadow-sm max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Rechercher un ticket..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-2">
              <span className="text-sm text-gray-500">Filtrer :</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 text-sm rounded-full ${activeFilter === 'all' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setActiveFilter('OPEN')}
                  className={`px-3 py-1 text-sm rounded-full ${activeFilter === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Ouverts
                </button>
                <button
                  onClick={() => setActiveFilter('IN_PROGRESS')}
                  className={`px-3 py-1 text-sm rounded-full ${activeFilter === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  En cours
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun ticket trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || activeFilter !== 'all' 
                ? 'Aucun ticket ne correspond à votre recherche.'
                : 'Vous n\'avez pas encore créé de ticket de support.'}
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowNewTicketForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Nouveau ticket
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredTickets.map((ticket) => {
              const Icon = categoryIcons[ticket.category] || MessageSquare;
              const statusClass = statusColors[ticket.status] || 'bg-gray-100 text-gray-800';
              const statusLabel = statusLabels[ticket.status] || ticket.status;
              const categoryLabel = categoryLabels[ticket.category] || ticket.category;
              
              return (
                <li key={ticket.id}>
                  <Link href={`/support/tickets/${ticket.id}`} className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100 text-emerald-600">
                              <Icon className="h-5 w-5" />
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-emerald-600 truncate">
                              {ticket.subject}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <span>#{ticket.ticketNumber}</span>
                              <span className="mx-1">•</span>
                              <span>{categoryLabel}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                              {statusLabel}
                            </span>
                            <ChevronRight className="ml-2 h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <div className="flex items-center text-sm text-gray-500">
                            <MessageSquare className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                            <p>
                              {ticket.messages.length} {ticket.messages.length > 1 ? 'messages' : 'message'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          <p>
                            Dernière mise à jour le{' '}
                            <time dateTime={ticket.updatedAt}>
                              {new Date(ticket.updatedAt).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </time>
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
      <div className="mt-8 bg-amber-50 border-l-4 border-amber-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-700">
              Notre équipe vous répond généralement dans les 24 heures. Pour une réponse plus rapide, consultez notre{' '}
              <a href="/faq" className="font-medium underline text-amber-700 hover:text-amber-600">
                FAQ
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
