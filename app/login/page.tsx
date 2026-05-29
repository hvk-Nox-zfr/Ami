"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault();

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setMessage("Email ou mot de passe incorrect");
    } else {
      setMessage("Connexion réussie !");
      window.location.href = "/home";
    }
  }

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Connexion</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <input
          type="email"
          placeholder="Email"
          className="p-3 rounded bg-gray-800 border border-gray-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          className="p-3 rounded bg-gray-800 border border-gray-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="p-3 bg-blue-600 rounded hover:bg-blue-700 transition"
        >
          Se connecter
        </button>
      </form>

      {message && (
        <p className="mt-4 text-blue-400">{message}</p>
      )}

      <a href="/register" className="mt-4 text-blue-400 hover:underline">
        Pas encore de compte ? S'inscrire
      </a>
    </main>
  );
}
