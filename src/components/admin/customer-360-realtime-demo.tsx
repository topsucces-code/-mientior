'use client'

import { useState, useCallback } from 'react'
import { useCustomer360Realtime } from '@/hooks/use-customer-360-realtime'
import type { Customer360UpdateData } from '@/types/customer-360'

interface Customer360RealtimeDemoProps {
  customerId: string
}

/**
 * Demo component showing real-time updates in Customer 360 dashboard
 * 
 * This component demonstrates how the Customer 360 dashboard would
 * receive and display real-time updates for a specific customer.
 */
export function Customer360RealtimeDemo({ customerId }: Customer360RealtimeDemoProps) {
  const [updates, setUpdates] = useState<Customer360UpdateData[]>([])
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected')

  const handleUpdate = useCallback((update: Customer360UpdateData) => {
    console.log('Customer 360 update received:', update)
    setUpdates(prev => [update, ...prev].slice(0, 10)) // Keep last 10 updates
  }, [])

  const handleOrderUpdate = useCallback((update: Customer360UpdateData) => {
    console.log('Order update:', update.data)
    // In a real dashboard, this would update the orders section
  }, [])

  const handleLoyaltyUpdate = useCallback((update: Customer360UpdateData) => {
    console.log('Loyalty update:', update.data)
    // In a real dashboard, this would update the loyalty section
  }, [])

  const handleNotesUpdate = useCallback((update: Customer360UpdateData) => {
    console.log('Notes update:', update.data)
    // In a real dashboard, this would update the notes section
  }, [])

  const handleTagsUpdate = useCallback((update: Customer360UpdateData) => {
    console.log('Tags update:', update.data)
    // In a real dashboard, this would update the tags section
  }, [])

  const { isConnected, connectionState } = useCustomer360Realtime({
    customerId,
    onUpdate: handleUpdate,
    onOrderUpdate: handleOrderUpdate,
    onLoyaltyUpdate: handleLoyaltyUpdate,
    onNotesUpdate: handleNotesUpdate,
    onTagsUpdate: handleTagsUpdate,
  })

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Customer 360 Real-time Updates
        </h3>
        <p className="text-sm text-gray-600">
          Customer ID: {customerId}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div 
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-600">
            Connection: {connectionState}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Recent Updates</h4>
        
        {updates.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No updates received yet. Try updating an order, adding a note, or assigning a tag.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {updates.map((update, index) => (
              <div 
                key={`${update.timestamp}-${index}`}
                className="p-3 bg-gray-50 rounded border-l-4 border-blue-500"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {update.updateType} Update
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(update.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 mb-2">
                  {update.data.description || 'Update received'}
                </p>
                
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                    View details
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(update.data, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded">
        <h5 className="text-sm font-medium text-blue-900 mb-2">
          How to test real-time updates:
        </h5>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Update an order status for this customer</li>
          <li>• Add a note to this customer</li>
          <li>• Assign or remove a tag from this customer</li>
          <li>• Create a new order for this customer (loyalty points)</li>
        </ul>
      </div>
    </div>
  )
}