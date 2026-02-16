"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCallback } from "react";

export function AccountingBasisToggle() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const currentBasis = searchParams.get("basis") === "cash" ? "cash" : "accrual";

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set(name, value);
            return params.toString();
        },
        [searchParams]
    );

    const onValueChange = (value: string) => {
        router.push(pathname + "?" + createQueryString("basis", value));
    };

    return (
        <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-muted-foreground">Basis:</span>
            <Tabs value={currentBasis} onValueChange={onValueChange} className="w-[200px]">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="accrual">Accrual</TabsTrigger>
                    <TabsTrigger value="cash">Cash</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
}
