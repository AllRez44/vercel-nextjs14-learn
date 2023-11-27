import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            if (isLoggedIn) {
                if (!isOnDashboard) return Response.redirect(new URL('/dashboard', nextUrl));
                return true;
            }
            return false; // Redirect unauthenticated users to login page
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
