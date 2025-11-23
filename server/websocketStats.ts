import { WebSocket, WebSocketServer } from 'ws';
import { calculateStats, invalidateStatsCache, type ReportsData } from './statsService';

type StatsSubscriber = {
  ws: WebSocket;
  userId: string;
};

let subscribers: Map<string, StatsSubscriber> = new Map();
let broadcastInterval: NodeJS.Timeout | null = null;

export function setupStatsWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket, req) => {
    // Extract user info from URL query - format: ws://url?userId=123
    const url = new URL(req.url || '', 'ws://localhost');
    const userId = url.searchParams.get('userId');
    const isStatsStream = url.searchParams.get('stream') === 'stats';

    if (!userId || !isStatsStream) {
      ws.close(1008, 'Invalid subscription parameters');
      return;
    }

    const subscriberId = `${userId}-${Math.random().toString(36).substr(2, 9)}`;
    subscribers.set(subscriberId, { ws, userId });

    ws.on('close', () => {
      subscribers.delete(subscriberId);
      if (subscribers.size === 0 && broadcastInterval) {
        clearInterval(broadcastInterval);
        broadcastInterval = null;
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket stats error:', error);
      subscribers.delete(subscriberId);
    });

    // Start broadcast if not already running
    if (!broadcastInterval && subscribers.size > 0) {
      startBroadcast();
    }
  });
}

function startBroadcast() {
  broadcastInterval = setInterval(async () => {
    if (subscribers.size === 0) {
      if (broadcastInterval) {
        clearInterval(broadcastInterval);
        broadcastInterval = null;
      }
      return;
    }

    try {
      const stats = await calculateStats();
      const message = JSON.stringify({
        type: 'stats',
        data: stats,
      });

      // Broadcast to all connected clients
      let deadSubscribers: string[] = [];
      subscribers.forEach((subscriber, id) => {
        if (subscriber.ws.readyState === WebSocket.OPEN) {
          subscriber.ws.send(message);
        } else {
          deadSubscribers.push(id);
        }
      });

      // Clean up dead connections
      deadSubscribers.forEach(id => subscribers.delete(id));
    } catch (error) {
      console.error('Error broadcasting stats:', error);
    }
  }, 5000); // Broadcast every 5 seconds
}

export function notifyStatsChange() {
  invalidateStatsCache();
  // Force an immediate broadcast by sending to all subscribers
  if (subscribers.size > 0) {
    calculateStats()
      .then(stats => {
        const message = JSON.stringify({
          type: 'stats',
          data: stats,
        });

        subscribers.forEach((subscriber) => {
          if (subscriber.ws.readyState === WebSocket.OPEN) {
            subscriber.ws.send(message);
          }
        });
      })
      .catch(error => console.error('Error sending stats update:', error));
  }
}

export function getSubscriberCount(): number {
  return subscribers.size;
}
