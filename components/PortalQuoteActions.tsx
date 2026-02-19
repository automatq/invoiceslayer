"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, PenTool } from "lucide-react";
import { SignaturePad } from "./SignaturePad";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PortalQuoteActionsProps {
    quoteId: string;
    onAccept: () => Promise<void>;
    onReject: () => Promise<void>;
    onSign: (signatureData: string, metadata?: { name?: string; title?: string; company?: string }) => Promise<void>;
}

export function PortalQuoteActions({ quoteId, onAccept, onReject, onSign }: PortalQuoteActionsProps) {
    const [showSignature, setShowSignature] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSign = async (signatureData: string, metadata?: { name?: string; title?: string; company?: string }) => {
        setIsSubmitting(true);
        try {
            await onSign(signatureData, metadata);
            setShowSignature(false);
        } catch (error) {
            console.error("Failed to sign:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-end gap-2">
                <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowSignature(true)}
                >
                    <PenTool className="mr-1 h-4 w-4" />
                    Sign & Accept
                </Button>
                <form action={onAccept}>
                    <Button 
                        type="submit" 
                        size="sm" 
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Accept
                    </Button>
                </form>
                <form action={onReject}>
                    <Button 
                        type="submit" 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                    >
                        <XCircle className="mr-1 h-4 w-4" />
                        Reject
                    </Button>
                </form>
            </div>

            <Dialog open={showSignature} onOpenChange={setShowSignature}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Sign Quote</DialogTitle>
                    </DialogHeader>
                    <SignaturePad 
                        onSave={handleSign}
                        onCancel={() => setShowSignature(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
