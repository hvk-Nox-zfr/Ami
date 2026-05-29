import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    email: string;
    name?: string;
    avatar?: string;
  }

  interface Session {
    user: {
      id?: string;
      email: string;
      name?: string;
      avatar?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    avatar?: string;
  }
}
