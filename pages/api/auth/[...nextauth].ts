import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "default-secret-change-in-production",
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Get IP address from headers
      const ipAddress = 'unknown'; // Will be set in api route
      
      console.log('Social login attempt:', {
        email: user.email,
        name: user.name,
        provider: account?.provider,
      });
      
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      return baseUrl + "/dashboard";
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.role = (user as any).role || 'user';
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token, user }) {
      if (session?.user && token) {
        (session.user as any).id = token.id as string;
        (session.user as any).provider = token.provider as string;
        (session.user as any).role = token.role as string;
      }
      
      // Update lastLogin in database
      if (user && 'id' in user) {
        try {
          await prisma.user.update({
            where: { id: user.id as string },
            data: { lastLogin: new Date() }
          });
        } catch (error) {
          console.error('Error updating lastLogin:', error);
        }
      }
      
      return session;
    },
  },
});
