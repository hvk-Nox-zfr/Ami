export const dynamic = "force-dynamic";

import ClientLayout from "../ClientLayout";
import HomeClientWrapper from "./HomeClientWrapper";
import PushClient from "../push-client"; // ← ajoute ça

export default function Page() {
  const username = "TON_USERNAME_ICI"; // ou récupéré depuis ton auth

  return (
    <ClientLayout>
      <PushClient username={username} />   {/* ← ajoute ça */}
      <HomeClientWrapper />
    </ClientLayout>
  );
}
