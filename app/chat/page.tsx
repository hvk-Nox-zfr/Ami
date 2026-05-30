import Chat from "@/components/Chat";

export default function Page() {
  return (
    <div className="h-screen">
      <Chat
        otherUser="ami1@test.com"
        onCall={(friend) => console.log("Appel lancé vers", friend)}
      />
    </div>
  );
}
