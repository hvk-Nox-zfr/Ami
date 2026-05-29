export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-4">Bienvenue sur Ami 👋</h1>
      <p className="text-lg mb-6">Ton futur réseau social privé</p>

      <a
        href="/login"
        className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
      >
        Se connecter
      </a>
    </main>
  )
}
