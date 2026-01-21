"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AppleIcon, GoogleIcon } from "../icons";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

interface Account {
  id: string;
  provider: string;
  providerAccountId: string;
  type: string;
}

export function ConnectedAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  const providers = [
    {
      id: "google",
      name: "Google",
      icon: GoogleIcon,
      description: "Connect your Google account to sync your calendar.",
    },
    {
      id: "apple",
      name: "Apple",
      icon: AppleIcon,
      description: "Sign in with Apple for faster access.",
    },
  ];

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/user/accounts");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (providerId: string) => {
    try {
      setConnecting(providerId);
      // Use NextAuth signIn to link the account
      const result = await signIn(providerId, {
        redirect: false,
        callbackUrl: "/dashboard/settings",
      });

      if (result?.error) {
        toast.error("Failed to connect account");
      } else if (result?.ok) {
        toast.success("Account connected successfully");
        fetchAccounts();
      }
    } catch (error) {
      toast.error("Failed to connect account");
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: string, providerName: string) => {
    if (
      !confirm(
        `Are you sure you want to disconnect your ${providerName} account?`,
      )
    ) {
      return;
    }

    try {
      setDisconnecting(accountId);
      const response = await fetch("/api/user/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      if (response.ok) {
        toast.success("Account disconnected successfully");
        fetchAccounts();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to disconnect account");
      }
    } catch (error) {
      toast.error("Failed to disconnect account");
    } finally {
      setDisconnecting(null);
    }
  };

  const isConnected = (providerId: string) => {
    return accounts.some((account) => account.provider === providerId);
  };

  const getAccountId = (providerId: string) => {
    return accounts.find((account) => account.provider === providerId)?.id;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {providers.map((provider) => {
        const connected = isConnected(provider.id);
        const accountId = getAccountId(provider.id);
        const isDisconnectingThis = disconnecting === accountId;
        const isConnectingThis = connecting === provider.id;

        return (
          <div
            key={provider.id}
            className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-full">
                <provider.icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm leading-none font-medium">
                  {provider.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {provider.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`text-xs sm:inline ${
                  connected ? "text-green-600" : "text-muted-foreground"
                }`}
              >
                {connected ? "Connected" : "Not connected"}
              </span>
              {connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    accountId && handleDisconnect(accountId, provider.name)
                  }
                  disabled={isDisconnectingThis}
                >
                  {isDisconnectingThis ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                      Disconnecting...
                    </>
                  ) : (
                    "Disconnect"
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConnect(provider.id)}
                  disabled={isConnectingThis}
                >
                  {isConnectingThis ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
