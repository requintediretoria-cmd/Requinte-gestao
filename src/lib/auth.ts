import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const OWNER_HASH = bcrypt.hashSync(
  process.env.OWNER_PASSWORD || "requinte2024",
  10
);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.password) return null;
        const valid = bcrypt.compareSync(credentials.password, OWNER_HASH);
        if (!valid) return null;
        return { id: "owner", name: "Proprietário", email: "dono@requinte.com" };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async session({ session }) {
      return session;
    },
  },
};
