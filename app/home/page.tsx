export const dynamic = "force-dynamic";

import ClientLayout from "../ClientLayout";
import HomeClientWrapper from "./HomeClientWrapper";

export default function Page() {
  return (
    <ClientLayout>
      <HomeClientWrapper />
    </ClientLayout>
  );
}
