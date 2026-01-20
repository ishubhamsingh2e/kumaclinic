"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  generateApiKey,
  getApiKeys,
  deleteApiKey,
} from "@/lib/actions/api-key";
import { format } from "date-fns";
import { ApiKey } from "@prisma/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash } from "lucide-react";

export function IntegrationsTab() {
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(
    null,
  );
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchApiKeys = async () => {
    const result = await getApiKeys();
    if (result.apiKeys) {
      setApiKeys(result.apiKeys);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleGenerateApiKey = async () => {
    setIsLoading(true);
    const result = await generateApiKey();
    if (result.apiKey) {
      setNewlyGeneratedKey(result.apiKey);
      await fetchApiKeys();
      toast.success("New API key generated.");
    } else {
      toast.error(result.error || "Failed to generate API key.");
    }
    setIsLoading(false);
  };

  const handleDeleteApiKey = async (apiKeyId: string) => {
    setIsDeleting(apiKeyId);
    const result = await deleteApiKey(apiKeyId);
    if (result.success) {
      await fetchApiKeys();
      toast.success("API key deleted.");
    } else {
      toast.error(result.error || "Failed to delete API key.");
    }
    setIsDeleting(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          API keys allow you to integrate external services with your clinic.
        </p>
        <div className="flex gap-2">
          <Input
            readOnly
            value={
              newlyGeneratedKey || "Click generate to create a new API key"
            }
          />
          <Button
            onClick={() => {
              if (newlyGeneratedKey) {
                navigator.clipboard.writeText(newlyGeneratedKey);
                toast.success("API key copied to clipboard.");
              }
            }}
            disabled={!newlyGeneratedKey}
          >
            Copy
          </Button>
        </div>
        <Button onClick={handleGenerateApiKey} disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate New Key"}
        </Button>

        <div className="space-y-2">
          <h4 className="text-lg font-medium">Existing Keys</h4>
          <ul className="space-y-2">
            {apiKeys.map((key) => (
              <li
                key={key.id}
                className="flex items-center justify-between rounded-md border p-2"
              >
                <div>
                  <span className="font-mono">
                    {key.key.substring(0, 8)}...
                  </span>
                  <span className="text-muted-foreground ml-4">
                    Created on {format(key.createdAt, "PPP")}
                  </span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      disabled={isDeleting === key.id}
                    >
                      {isDeleting === key.id ? (
                        "..."
                      ) : (
                        <Trash className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the API key and any
                        integrations using it will stop working.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteApiKey(key.id)}
                      >
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
