"use client";

import { InvoiceLayoutProps } from "./types";
import { ModernLayout } from "./layouts/ModernLayout";
import { ClassicLayout } from "./layouts/ClassicLayout";
import { MinimalistLayout } from "./layouts/MinimalistLayout";

export function InvoiceRenderer(props: InvoiceLayoutProps) {
    const { settings } = props;

    // Normalize layout string to handle potential case sensitivity or defaults
    const layout = (settings.layout || "modern").toLowerCase();

    switch (layout) {
        case "classic":
            return <ClassicLayout {...props} />;
        case "minimal":
        case "minimalist":
            return <MinimalistLayout {...props} />;
        case "modern":
        default:
            return <ModernLayout {...props} />;
    }
}
