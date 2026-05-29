"use client";

import { useEffect, useState } from "react";

export default function GroupList({ onSelect }: { onSelect: (id: string) => void }) {
  const [groups, setGroups] = useState<any[]>([]);

  const load = async () => {
    const res = await fetch("/api/groups/list");
    const data = await res.json();
    setGroups(data.groups || []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-2">
      <h2 className="font-bold text-lg">Mes groupes</h2>

      {groups.map((g) => (
        <div
          key={g._id}
          onClick={() => onSelect(g._id)}
          className="p-2 border rounded cursor-pointer hover:bg-gray-100"
        >
          {g.name}
        </div>
      ))}
    </div>
  );
}
