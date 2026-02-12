import type { Actions } from './$types';
import { sendReset } from "$lib/emails/reset";

export const actions: Actions = {
	default: async ({ request, url }) => {
		const formData = await request.formData();

		const data = Object.fromEntries(formData.entries());

		sendReset(data.email as string, url.origin);

		return { ...data };
	}
};
