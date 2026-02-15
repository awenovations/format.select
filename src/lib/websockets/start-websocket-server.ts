import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createShardedAdapter } from '@socket.io/redis-adapter';

let io: Server | null = null;

export const startWebsocketServer = async (httpServer: any) => {
	const redisUrl = process.env.REDIS_URI;

	// Always create the Socket.IO server so /socket.io/ requests are handled
	io = new Server(httpServer, { path: '/events/' });

	// Optionally attach Redis adapter for multi-process support
	if (redisUrl) {
		try {
			const pubClient = createClient({ url: redisUrl });
			const subClient = pubClient.duplicate();

			pubClient.on('error', (err) =>
				console.error('[Socket.IO] Redis pub error:', err.message)
			);
			subClient.on('error', (err) =>
				console.error('[Socket.IO] Redis sub error:', err.message)
			);

			await Promise.all([pubClient.connect(), subClient.connect()]);

			io.adapter(createShardedAdapter(pubClient, subClient));
			console.log('[Socket.IO] WebSocket server started with Redis adapter');
		} catch (err: any) {
			console.warn(
				`[Socket.IO] Could not connect to Redis, using in-memory adapter: ${err.message}`
			);
		}
	} else {
		console.warn('[Socket.IO] REDIS_URI not set, using in-memory adapter');
	}

	io.on('connection', (socket) => {
		socket.on('register', async (userId: string) => {
			socket.join(userId);

			if (!redisUrl) return;

			let jobRedis: ReturnType<typeof createClient> | null = null;
			try {
				jobRedis = createClient({ url: redisUrl });
				jobRedis.on('error', (err) =>
					console.error('[Socket.IO] Redis job error:', err.message)
				);
				await jobRedis.connect();

				jobRedis.subscribe(`progress:${userId}`, (message) => {
					const data = JSON.parse(message);
					socket.emit('conversion-progress', data);
				});

				socket.on('disconnect', async () => {
					if (jobRedis) {
						await jobRedis.unsubscribe(`progress:${userId}`).catch(() => {});
						await jobRedis.quit().catch(() => {});
					}
				});
			} catch (err: any) {
				console.warn(`[Socket.IO] Could not subscribe to progress for ${userId}: ${err.message}`);
			}
		});
	});
};

export function emitToUser(userId: string, event: string, data: unknown) {
	if (io) {
		io.to(userId).emit(event, data);
	}
}
