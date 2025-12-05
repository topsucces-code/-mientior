'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  MessageSquare, 
  Paperclip, 
  Send, 
  CheckCircle2, 
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface Message {
  id: string;
  content: string;
  isStaff: boolean;
  isInternal: boolean;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  attachments?: Array<{ url: string; name: string; type: string }>;
  createdAt: string;
  readAt: string | null;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  messages: Message[];
  orderId?: string | null;
  vendorId?: string | null;
  assignedToId?: string | null;
  assignedTo?: {
    name: string;
    email: string;
  } | null;
}

interface TicketDetailProps {
  initialTicket: Ticket;
  user: User;
}

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

// Priority colors
const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-amber-100 text-amber-800',
  URGENT: 'bg-red-100 text-red-800',
};

// Priority labels
const priorityLabels: Record<string, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  URGENT: 'Urgent',
};

// Category labels
const categoryLabels: Record<string, string> = {
  ORDER_ISSUE: 'Problème de commande',
  PAYMENT_ISSUE: 'Problème de paiement',
  DELIVERY_ISSUE: 'Problème de livraison',
  PRODUCT_QUESTION: 'Question sur un produit',
  RETURN_REFUND: 'Retour ou remboursement',
  ACCOUNT_ISSUE: 'Problème de compte',
  VENDOR_ISSUE: 'Question vendeur',
  TECHNICAL_ISSUE: 'Problème technique',
  OTHER: 'Autre',
};

// Format date helper
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Format message date helper
function formatMessageDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function TicketDetail({ initialTicket, user }: TicketDetailProps) {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});

  // Toggle message expansion
  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...files]);
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && attachments.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/support/tickets/${ticket.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim() }),
      });
      
      if (response.ok) {
        const updatedTicket = await response.json();
        setTicket(updatedTicket);
        setMessage('');
        setAttachments([]);
        
        // Scroll to bottom of messages
        setTimeout(() => {
          const messagesContainer = document.getElementById('messages-container');
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle ticket status update
  const updateTicketStatus = async (status: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        const updatedTicket = await response.json();
        setTicket(updatedTicket);
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/support')}
          className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste des tickets
        </button>
      </div>

      {/* Ticket header */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h1 className="text-lg leading-6 font-medium text-gray-900">
              {ticket.subject}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Ticket #{ticket.ticketNumber} • Créé le{' '}
              {formatDate(ticket.createdAt)}
            </p>
          </div>
          <div className="flex space-x-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColors[ticket.status] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {statusLabels[ticket.status] || ticket.status}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                priorityColors[ticket.priority] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {priorityLabels[ticket.priority] || ticket.priority}
            </span>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Catégorie</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {categoryLabels[ticket.category] || ticket.category}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Dernière mise à jour</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(ticket.updatedAt)}
              </dd>
            </div>
            {ticket.orderId && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Commande associée</dt>
                <dd className="mt-1 text-sm text-emerald-600 hover:text-emerald-500">
                  <a href={`/account/orders/${ticket.orderId}`}>Voir la commande</a>
                </dd>
              </div>
            )}
            {ticket.assignedTo && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Assigné à</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {ticket.assignedTo.name}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Initial description */}
      <div className="bg-white shadow sm:rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Description initiale
          </h3>
          <div className="prose max-w-none text-gray-700">
            <p className="whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Historique des messages ({ticket.messages.length})
          </h3>
          
          <div 
            id="messages-container"
            className="space-y-4 max-h-[500px] overflow-y-auto mb-6 pr-2"
          >
            {ticket.messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2">Aucun message pour le moment</p>
              </div>
            ) : (
              ticket.messages.map(msg => {
                const isCurrentUser = msg.senderId === user.id;
                const isExpanded = expandedMessages[msg.id] !== undefined 
                  ? expandedMessages[msg.id] 
                  : true;
                  
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      isCurrentUser ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[75%] rounded-lg p-4',
                        isCurrentUser
                          ? 'bg-emerald-50 border border-emerald-100'
                          : msg.isStaff
                          ? 'bg-blue-50 border border-blue-100'
                          : 'bg-gray-50 border border-gray-100'
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div
                            className={cn(
                              'h-8 w-8 rounded-full flex items-center justify-center mr-2 text-sm font-medium',
                              isCurrentUser
                                ? 'bg-emerald-100 text-emerald-600'
                                : msg.isStaff
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-600'
                            )}
                          >
                            {msg.senderName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p
                              className={cn(
                                'text-sm font-medium',
                                isCurrentUser
                                  ? 'text-emerald-700'
                                  : msg.isStaff
                                  ? 'text-blue-700'
                                  : 'text-gray-700'
                              )}
                            >
                              {msg.isStaff ? `${msg.senderName} (Support)` : msg.senderName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatMessageDate(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        {msg.content.length > 200 && (
                          <button
                            onClick={() => toggleMessageExpansion(msg.id)}
                            className="text-gray-400 hover:text-gray-500 ml-2"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>

                      <div className="mt-2">
                        <p
                          className={cn(
                            'text-sm whitespace-pre-wrap',
                            isCurrentUser
                              ? 'text-emerald-800'
                              : msg.isStaff
                              ? 'text-blue-800'
                              : 'text-gray-700',
                            !isExpanded && msg.content.length > 200 && 'line-clamp-3'
                          )}
                        >
                          {msg.content}
                        </p>
                        
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {msg.attachments.map((file, index) => (
                              <a
                                key={index}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-500"
                              >
                                <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                                {file.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Closed ticket notice */}
          {ticket.status === 'CLOSED' ? (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Ce ticket est fermé. Vous ne pouvez plus y répondre.
                  </p>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => updateTicketStatus('OPEN')}
                      className="bg-white text-blue-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Rouvrir le ticket
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Reply form */
            <form onSubmit={handleSubmit} className="mt-6">
              <div>
                <label htmlFor="message" className="sr-only">
                  Votre message
                </label>
                <textarea
                  rows={4}
                  name="message"
                  id="message"
                  className="shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                  placeholder="Tapez votre message ici..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Attachments preview */}
              {attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                    >
                      <div className="flex items-center">
                        <Paperclip className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700 truncate max-w-xs">
                          {file.name}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex justify-between items-center">
                <div>
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Joindre un fichier
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    JPG, PNG, PDF, DOC (max. 5MB)
                  </p>
                </div>

                <div className="flex space-x-3">
                  {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      onClick={() => updateTicketStatus('CLOSED')}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      Fermer le ticket
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting || (!message.trim() && attachments.length === 0)}
                    className={cn(
                      'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500',
                      isSubmitting || (!message.trim() && attachments.length === 0)
                        ? 'bg-emerald-300 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="-ml-1 mr-2 h-4 w-4" />
                        Envoyer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
