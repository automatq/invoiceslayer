"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { createCheckoutSession } from "@/app/actions/stripe";
import { toast } from "sonner";

interface CheckoutButtonProps {
    invoiceId: string;
    amount: number;
}

export function CheckoutButton({ invoiceId, amount }: CheckoutButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        try {
            setLoading(true);
            const { url } = await createCheckoutSession(invoiceId);
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to start payment. Please try again.");
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleCheckout}
            disabled={loading}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
            {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <CreditCard className="mr-2 h-4 w-4" />
            )}
            Pay ${amount.toFixed(2)} Now
        </Button>
    );
}
