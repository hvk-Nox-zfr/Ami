import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    email: string;
    username: string;   // 🔥 IMPORTANT
    avatar?: string;
  }

  interface Session {
    user: {
      id?: string;
      email: string;
      username: string; // 🔥 IMPORTANT
      avatar?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string;   // 🔥 IMPORTANT
    avatar?: string;
  }
}
