import { handler } from './build/handler.js';
import winston from 'winston';

import express from 'express';

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

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
});
