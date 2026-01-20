import bcrypt from "bcryptjs";
import { AuthOptions } from "next-auth";
import { prisma } from "./db";
import { ROLES } from "./rbac";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  pages: {
    signIn: "/login",
  },
  providers: [
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
          include: {
            memberships: {
              include: {
                Clinic: true,
                Role: true,
              },
            },
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

        const activeClinicId = user.defaultClinicId;
        const activeClinicMember = user.memberships.find(
          (cm) => cm.clinicId === activeClinicId,
        );
        const role = activeClinicMember?.Role.name || "USER";
        const permissions = ROLES[role as keyof typeof ROLES] || [];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          title: user.title,
          image: user.image,
          permissions,
          clinics: user.memberships.map((cm) => ({
            ...cm.Clinic,
            role: cm.Role.name,
          })),
          activeClinicId: user.defaultClinicId,
          defaultClinicId: user.defaultClinicId,
          role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.activeClinicId) {
        token.activeClinicId = session.activeClinicId;
        const activeClinicMember = await prisma.clinicMember.findFirst({
          where: {
            userId: token.id,
            clinicId: session.activeClinicId,
          },
          include: {
            Role: true,
          },
        });
        if (activeClinicMember) {
          token.role = activeClinicMember.Role.name;
          token.permissions = ROLES[token.role as keyof typeof ROLES] || [];
        }
      }

      if (user) {
        token.id = user.id;
        token.title = user.title;
        token.image = user.image;
        token.permissions = user.permissions;
        token.clinics = user.clinics;
        token.activeClinicId = user.activeClinicId;
        token.defaultClinicId = user.defaultClinicId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.title = token.title;
        session.user.image = token.image;
        session.user.permissions = token.permissions;
        session.user.clinics = token.clinics;
        session.user.activeClinicId = token.activeClinicId;
        session.user.defaultClinicId = token.defaultClinicId;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
