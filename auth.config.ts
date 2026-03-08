import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthRoute =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/forgot-password") ||
        nextUrl.pathname.startsWith("/verify-otp") ||
        nextUrl.pathname.startsWith("/reset-password");

      if (isAuthRoute) return !isLoggedIn;
      return isLoggedIn;
    },
  },
  providers: [],
} satisfies NextAuthConfig;

