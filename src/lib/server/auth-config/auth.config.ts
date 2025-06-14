// src/lib/server/auth-config/auth.config.ts
import { env } from "$env/dynamic/private";
import { db } from "$lib/server/db";
import Google from "@auth/core/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { SvelteKitAuth } from "@auth/sveltekit";

export const { handle, signIn, signOut } = SvelteKitAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("[AUTH] === SIGNIN CALLBACK START ===");
      console.log("[AUTH] User:", JSON.stringify(user, null, 2));
      console.log("[AUTH] Account:", JSON.stringify(account, null, 2));
      console.log("[AUTH] Profile:", JSON.stringify(profile, null, 2));
      console.log("[AUTH] === SIGNIN CALLBACK END ===");
      return true;
    },
    async session({ session, user }) {
      console.log("[AUTH] === SESSION CALLBACK START ===");
      console.log("[AUTH] Session:", JSON.stringify(session, null, 2));
      console.log("[AUTH] User:", JSON.stringify(user, null, 2));
      console.log("[AUTH] === SESSION CALLBACK END ===");

      if (session.user && user) {
        session.user.id = user.id;
        session.user.role = user.role || "CUSTOMER";
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log("[AUTH] === SIGNIN EVENT ===");
      console.log(
        "[AUTH] User signed in:",
        user.email,
        "via",
        account?.provider,
      );
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "database",
  },
  debug: true,
  logger: {
    error: (code, ...message) => {
      console.error("[AUTH ERROR]", code, message);
    },
    warn: (code, ...message) => {
      console.warn("[AUTH WARN]", code, message);
    },
    debug: (code, ...message) => {
      console.log("[AUTH DEBUG]", code, message);
    },
  },
});
