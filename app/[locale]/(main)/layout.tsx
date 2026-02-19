import React from "react";
import { DashboardClientLayout } from "@/components/DashboardClientLayout";
import { Header } from "@/components/Header";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardClientLayout header={<Header />}>
            {children}
        </DashboardClientLayout>
    );
}
