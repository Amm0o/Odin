// src/routes/protected/+layout.server.ts
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  if (!locals.session) {
    throw redirect(302, '/auth/signin');
  }
};
