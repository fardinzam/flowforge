"use client";

import { useEffect, useState } from "react";

type SecretOption = { id: string; name: string };

type SecretPickerProps = {
  workspaceId: string;
  value: string;
  onChange(secretId: string): void;
};

export function SecretPicker({
  workspaceId,
  value,
  onChange,
}: SecretPickerProps) {
  const [secrets, setSecrets] = useState<SecretOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch(`/api/secrets?workspaceId=${encodeURIComponent(workspaceId)}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(
        (data: {
          secrets: Array<{ id: string; name: string; status: string }>;
        }) => {
          setSecrets(data.secrets.filter((s) => s.status === "active"));
        },
      )
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading) {
    return (
      <select disabled>
        <option>Loading...</option>
      </select>
    );
  }

  if (fetchError) {
    return <span>Failed to load secrets.</span>;
  }

  return (
    <select onChange={(e) => onChange(e.target.value)} value={value}>
      <option value="">— select secret —</option>
      {secrets.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
