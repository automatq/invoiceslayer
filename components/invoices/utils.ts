import { InvoiceSettings } from "./types";

export function getFontClassName(font: string): string {
    const fontMap: Record<string, string> = {
        "inter": "font-sans",
        "montserrat": "font-montserrat",
        "playfair": "font-playfair",
        "lato": "font-lato",
        "roboto-slab": "font-roboto-slab",
        "lora": "font-lora",
        "serif": "font-serif",
        "mono": "font-mono",
    };

    return fontMap[font] || "font-sans";
}
