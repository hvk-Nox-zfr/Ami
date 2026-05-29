"use client";

import { useState } from "react";
import CreateGroup from "@/components/CreateGroup";
import GroupList from "@/components/GroupList";
import GroupChat from "@/components/GroupChat";

export default function GroupsPage() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  return (
    <div className="flex gap-4 p-4">
      <div className="w-1/3 space-y-4">
        <CreateGroup onCreated={() => window.location.reload()} />
        <GroupList onSelect={(id) => setSelectedGroup(id)} />
      </div>

      <div className="flex-1 border rounded-lg">
        {selectedGroup ? (
          <GroupChat groupId={selectedGroup} />
        ) : (
          <p className="p-4 text-gray-500">Sélectionne un groupe</p>
        )}
      </div>
    </div>
  );
}
