import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import Cookies from 'js-cookie';

let stompClient = null;

export function connectWebSocket(onMessage) {
  const token = Cookies.get('token');
  if (!token) {
    console.error("JWT token missing");
    return;
 }

  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${process.env.NEXT_PUBLIC_WS_URL}`),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    onConnect: () => {
      stompClient.subscribe('/user/queue/pdf-result', (msg) => {
        try {
          const data = JSON.parse(msg.body);
          console.log('Received WS message', data);
          onMessage(data);
        } catch (e) {
          console.error('WS parse error', e);
        }
      });
    },
    onStompError: (frame) => console.error('STOMP error', frame),
  });

  stompClient.activate();
  return stompClient;
}

export function disconnectWebSocket() {
  if (stompClient?.active) stompClient.deactivate();
  stompClient = null;
}
