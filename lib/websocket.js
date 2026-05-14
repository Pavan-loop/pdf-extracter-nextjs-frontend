import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import Cookies from 'js-cookie';

let stompClient = null;

/**
 * @param {(data: object) => void} onMessage   - called for every incoming PDF result
 * @param {(connected: boolean) => void} [onStatusChange] - called on connect / disconnect
 */
export function connectWebSocket(onMessage, onStatusChange) {
  // Always tear down any existing connection before creating a new one
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }

  const token = Cookies.get('token');
  if (!token) {
    console.error('[WS] No JWT token — aborting connection');
    return null;
  }

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (!wsUrl) {
    console.error('[WS] NEXT_PUBLIC_WS_URL is not defined');
    return null;
  }

  // Use a LOCAL variable so onConnect always references the right client,
  // even if stompClient (module-level) is reassigned by a concurrent call.
  const client = new Client({
    webSocketFactory: () => new SockJS(wsUrl),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,

    // Keep connection alive — without this, idle sockets drop after ~60s
    heartbeatIncoming: 25000,
    heartbeatOutgoing: 25000,

    onConnect: () => {
      onStatusChange?.(true);

      // Subscribe on the LOCAL client reference — never stale
      client.subscribe('/user/queue/pdf-result', (msg) => {
        try {
          onMessage(JSON.parse(msg.body));
        } catch (e) {
          console.error('[WS] Failed to parse message', e);
        }
      });
    },

    onDisconnect: () => {
      onStatusChange?.(false);
    },

    onStompError: (frame) => {
      const reason = frame.headers?.message || 'Unknown STOMP error';
      console.error('[WS] STOMP error:', reason);
      onStatusChange?.(false);
      // JWT missing / expired — force re-login
      if (
        reason.toLowerCase().includes('auth') ||
        reason.toLowerCase().includes('jwt') ||
        reason.toLowerCase().includes('token') ||
        reason.toLowerCase().includes('unauthorized')
      ) {
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    },

    onWebSocketError: (e) => {
      console.error('[WS] WebSocket error', e);
      onStatusChange?.(false);
    },
  });

  stompClient = client;
  client.activate();
  return client;
}

export function disconnectWebSocket() {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
}
