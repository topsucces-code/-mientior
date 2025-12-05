import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth-server';

// Store active connections per user
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

// Add a connection for a user
function addConnection(userId: string, controller: ReadableStreamDefaultController) {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(controller);
}

// Remove a connection for a user
function removeConnection(userId: string, controller: ReadableStreamDefaultController) {
  const userConnections = connections.get(userId);
  if (userConnections) {
    userConnections.delete(controller);
    if (userConnections.size === 0) {
      connections.delete(userId);
    }
  }
}

// Send notification to a specific user
export function sendNotificationToUser(userId: string, notification: unknown) {
  const userConnections = connections.get(userId);
  if (userConnections) {
    const data = `data: ${JSON.stringify(notification)}\n\n`;
    const encoder = new TextEncoder();
    userConnections.forEach(controller => {
      try {
        controller.enqueue(encoder.encode(data));
      } catch (error) {
        // Connection might be closed
        console.error('Error sending notification:', error);
      }
    });
  }
}

// SSE endpoint for real-time notifications
export async function GET(request: NextRequest) {
  const session = await getSession();
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection
      addConnection(userId, controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        removeConnection(userId, controller);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
    cancel() {
      // Stream cancelled
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
