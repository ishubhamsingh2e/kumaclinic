import NextAuth, { DefaultSession } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      activeClinicId: string | null;
      defaultClinicId: string | null;
      role: string | null;
      permissions: string[];
      clinics: { id: string; name: string; role: string }[];
    } & DefaultSession["user"];
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!isValid) {
          return null;
        }

        return user;
      },
    }),
  ],
  secret: process.env.SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user || trigger === "update") {
        const userId = user?.id || (token.id as string);
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            memberships: {
              include: {
                clinic: true,
                role: { include: { permissions: true } },
              },
            },
          },
        });

        if (dbUser) {
          token.id = dbUser.id;

          // Determine active clinic:
          // 1. If manual update, use session.activeClinicId
          // 2. Else use dbUser.defaultClinicId
          // 3. Else use first membership
          let activeClinicId =
            session?.activeClinicId || dbUser.defaultClinicId;

          if (!activeClinicId && dbUser.memberships.length > 0) {
            activeClinicId = dbUser.memberships[0].clinicId;
          }

          const activeMembership = dbUser.memberships.find(
            (m) => m.clinicId === activeClinicId,
          );

          token.activeClinicId = activeClinicId;
          token.defaultClinicId = dbUser.defaultClinicId;
          token.role = activeMembership?.role?.name || null;
          token.permissions =
            activeMembership?.role?.permissions.map((p) => p.name) ?? [];
          token.clinics = dbUser.memberships.map((m) => ({
            id: m.clinic.id,
            name: m.clinic.name,
            role: m.role.name,
          }));
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.activeClinicId = token.activeClinicId as string | null;
      session.user.defaultClinicId = token.defaultClinicId as string | null;
      session.user.role = token.role as string | null;
      session.user.permissions = token.permissions as string[];
      session.user.clinics = (token.clinics as any) || [];
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
