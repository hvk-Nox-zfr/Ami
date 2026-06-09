export const dynamic = "force-dynamic";

import ClientLayout from "../ClientLayout";
import ChatClient from "./ChatClient";

export default function Page() {
  return (
    <ClientLayout>
      <ChatClient />
    </ClientLayout>
  );
}
