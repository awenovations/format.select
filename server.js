import { handler } from './build/handler.js';
import { createServer } from 'node:http';
import winston from 'winston';
import express from 'express';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createShardedAdapter } from '@socket.io/redis-adapter';

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
		winston.format.errors({ stack: true }),
		winston.format.colorize(),
		winston.format.printf(({ timestamp, level, message, stack }) => {
			return `${timestamp} [${level}]: ${stack || message}`;
		})
	),
	transports: [
		new winston.transports.Console({
			handleExceptions: true
		})
	],
	exitOnError: false
});

const app = express();

app.use((req, res, next) => {
	const start = Date.now();

	res.on('finish', () => {
		const duration = Date.now() - start;
		logger.info(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`, {
			ip: req.ip,
			query: req.query,
			body: req.body
		});
	});

	next();
});

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	next();
});

app.use(handler);

const server = createServer(app);

// Socket.IO setup with Redis adapter
async function startWebsocketServer(httpServer) {
	const redisUrl = process.env.REDIS_URI;

	// Always create the Socket.IO server so /events/ requests are handled
	const io = new Server(httpServer, { path: '/events/' });

	// Optionally attach Redis adapter for multi-process support
	if (redisUrl) {
		try {
			const pubClient = createClient({ url: redisUrl });
			const subClient = pubClient.duplicate();

			pubClient.on('error', (err) => console.error('[Socket.IO] Redis pub error:', err.message));
			subClient.on('error', (err) => console.error('[Socket.IO] Redis sub error:', err.message));

			await Promise.all([pubClient.connect(), subClient.connect()]);

			io.adapter(createShardedAdapter(pubClient, subClient));
			console.log('[Socket.IO] WebSocket server started with Redis adapter');
		} catch (err) {
			console.warn(`[Socket.IO] Could not connect to Redis, using in-memory adapter: ${err.message}`);
		}
	} else {
		console.warn('[Socket.IO] REDIS_URI not set, using in-memory adapter');
	}

	io.on('connection', (socket) => {
		socket.on('register', async (userId) => {
			socket.join(userId);

			if (!redisUrl) return;

			let jobRedis = null;
			try {
				jobRedis = createClient({ url: redisUrl });
				jobRedis.on('error', (err) => console.error('[Socket.IO] Redis job error:', err.message));
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
			} catch (err) {
				console.warn(`[Socket.IO] Could not subscribe to progress for ${userId}: ${err.message}`);
			}
		});
	});
}

startWebsocketServer(server);

const port = process.env.PORT || 3000;
server.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
});
