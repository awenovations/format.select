import { validateApiToken } from './api-tokens';
import mongoDbClient from '$lib/db/mongo';

interface AuthSuccess {
	authenticated: true;
	userId: string;
	user: any;
}

interface AuthFailure {
	authenticated: false;
	error: string;
	status: number;
}

export async function authenticateApiRequest(
	request: Request
): Promise<AuthSuccess | AuthFailure> {
	const authHeader = request.headers.get('authorization');
	if (!authHeader) {
		return { authenticated: false, error: 'Missing Authorization header', status: 401 };
	}

	const parts = authHeader.split(' ');
	if (parts.length !== 2 || parts[0] !== 'Bearer') {
		return { authenticated: false, error: 'Invalid Authorization header format. Use: Bearer <token>', status: 401 };
	}

	const token = parts[1];
	if (!token.startsWith('ic_')) {
		return { authenticated: false, error: 'Invalid token format', status: 401 };
	}

	const result = await validateApiToken(token);
	if (!result.valid) {
		return { authenticated: false, error: 'Invalid or revoked API token', status: 401 };
	}

	const db = (await mongoDbClient).db();
	const user = await db.collection('users').findOne({ _id: result.userId as any });

	if (!user) {
		return { authenticated: false, error: 'User not found', status: 401 };
	}

	return { authenticated: true, userId: result.userId, user };
}
