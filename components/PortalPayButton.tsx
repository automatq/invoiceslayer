"use client";

import { useState } from "react";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { createPortalCheckoutSession } from "@/app/actions/stripe";

interface PortalPayButtonProps {
    invoiceId: string;
    portalToken: string;
}

export function PortalPayButton({ invoiceId, portalToken }: PortalPayButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            const result = await createPortalCheckoutSession(invoiceId, portalToken);
            if (result.url) {
                window.location.href = result.url;
            } else {
                toast.error("Failed to start payment session");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <InteractiveButton
            size="sm"
            onClick={handlePayment}
            loading={isLoading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
            <CreditCard className="h-4 w-4" />
            Pay Now
        </InteractiveButton>
    );
}
