"use client";

import { useState } from "react";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, RefreshCw, ShieldCheck } from "lucide-react";
import { regeneratePortalToken } from "@/app/actions/portal";

export function ClientPortalAccess({ clientId, initialToken }: { clientId: string; initialToken: string | null }) {
    const [token, setToken] = useState<string | null>(initialToken);
    const [isLoading, setIsLoading] = useState(false);

    const portalUrl = token ? `${window.location.origin}/portal/${token}` : "";

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const result = await regeneratePortalToken(clientId);
            if (result.success && result.token) {
                setToken(result.token);
                toast.success("Portal link generated");
            } else {
                toast.error("Failed to generate link");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!portalUrl) return;
        navigator.clipboard.writeText(portalUrl);
        toast.success("Link copied to clipboard");
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <CardTitle>Client Portal</CardTitle>
                </div>
                <CardDescription>
                    Manage access to the client's secure portal.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!token ? (
                    <InteractiveButton onClick={handleGenerate} loading={isLoading} className="w-full">
                        Generate Secure Portal Link
                    </InteractiveButton>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Input value={portalUrl} readOnly className="font-mono text-xs" />
                            <InteractiveButton size="icon" variant="outline" onClick={handleCopy}>
                                <Copy className="h-4 w-4" />
                            </InteractiveButton>
                        </div>
                        <div className="flex justify-end">
                            <InteractiveButton
                                variant="ghost"
                                size="sm"
                                onClick={handleGenerate}
                                loading={isLoading}
                                className="text-xs text-muted-foreground hover:text-destructive"
                            >
                                <RefreshCw className={`mr-2 h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                                Rotate Token
                            </InteractiveButton>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
