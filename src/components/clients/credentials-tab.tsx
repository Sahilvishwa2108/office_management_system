"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableRow,
} from "@/components/ui/table";
import { RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Credential {
  id: string;
  key: string;
  value: string;
}

interface CredentialsTabProps {
  clientId: string;
  isAdmin: boolean;
}

export function CredentialsTab({ clientId, isAdmin }: CredentialsTabProps) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${clientId}/credentials`);
      if (!response.ok) throw new Error("Failed to fetch credentials");
      const data = await response.json();
      setCredentials(data.credentials || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load credentials");
    } finally {
      setLoading(false);
    }
  };

  const addCredential = async () => {
    if (!key || !value) {
      toast.error("Key and Value are required");
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!response.ok) throw new Error("Failed to add credential");
      const newCredential = await response.json();
      setCredentials((prev) => [...prev, newCredential]);
      setKey("");
      setValue("");
      toast.success("Credential added successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add credential");
    }
  };

  const deleteCredential = async (id: string) => {
  try {
    const response = await fetch(`/api/clients/${clientId}/credentials?credentialId=${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete credential");

    // Remove the deleted credential from the state
    setCredentials((prev) => prev.filter((cred) => cred.id !== id));
    toast.success("Credential deleted successfully");
  } catch (error) {
    console.error("Error deleting credential:", error);
    toast.error("Failed to delete credential");
  }
};

  useEffect(() => {
    fetchCredentials();
  }, [clientId]);

  return (
    <div className="space-y-6">
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Add Credential</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
              <Input
                placeholder="Value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              <Button onClick={addCredential}>Add</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Credentials</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCredentials}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {credentials.length > 0 ? (
            <Table>
              <thead>
                <TableRow>
                  <th>Key</th>
                  <th>Value</th>
                  {isAdmin && <th>Actions</th>}
                </TableRow>
              </thead>
              <tbody>
                {credentials.map((cred) => (
                  <TableRow key={cred.id}>
                    <td>{cred.key}</td>
                    <td>{cred.value}</td>
                    {isAdmin && (
                      <td>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteCredential(cred.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </TableRow>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center">
              No credentials found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
