import { NextResponse } from "next/server";

export async function GET() {
    const spec = {
        openapi: "3.0.0",
        info: {
            title: "InvoiceMaster Agent API",
            version: "1.0.0",
            description: "API for AI Agents (Picoclaw, Openclaw) to interact with InvoiceMaster."
        },
        servers: [
            {
                url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
                description: "Local Server"
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "API Key"
                }
            }
        },
        security: [
            {
                BearerAuth: []
            }
        ],
        paths: {
            "/api/v1/agent?resource=clients": {
                get: {
                    summary: "List Clients",
                    tags: ["Clients"],
                    responses: {
                        "200": {
                            description: "List of clients",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                id: { type: "string" },
                                                name: { type: "string" },
                                                email: { type: "string" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                post: {
                    summary: "Create Client",
                    tags: ["Clients"],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["name", "email"],
                                    properties: {
                                        name: { type: "string" },
                                        email: { type: "string", format: "email" },
                                        address: { type: "string" },
                                        phone: { type: "string" }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "200": {
                            description: "Created client",
                            content: { "application/json": { schema: { type: "object" } } }
                        }
                    }
                }
            },
            "/api/v1/agent?resource=invoices": {
                get: {
                    summary: "List Invoices",
                    tags: ["Invoices"],
                    responses: {
                        "200": {
                            description: "List of invoices",
                            content: { "application/json": { schema: { type: "array" } } }
                        }
                    }
                },
                post: {
                    summary: "Create Invoice",
                    tags: ["Invoices"],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["clientId", "items"],
                                    properties: {
                                        clientId: { type: "string" },
                                        date: { type: "string", format: "date" },
                                        dueDate: { type: "string", format: "date" },
                                        items: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                required: ["description", "quantity", "unitPrice"],
                                                properties: {
                                                    description: { type: "string" },
                                                    quantity: { type: "number" },
                                                    unitPrice: { type: "number" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "200": { description: "Created invoice" }
                    }
                },
                patch: {
                    summary: "Update Invoice Status",
                    tags: ["Invoices"],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["id", "status"],
                                    properties: {
                                        id: { type: "string" },
                                        status: { type: "string", enum: ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"] }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "200": { description: "Updated invoice" }
                    }
                }
            }
        },
        "/api/v1/agent?resource=escrow": {
            patch: {
                summary: "Update Escrow Status",
                tags: ["Escrow"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["invoiceId", "status"],
                                properties: {
                                    invoiceId: { type: "string" },
                                    status: { type: "string", enum: ["PENDING", "RELEASED", "CANCELLED"] }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Updated escrow contract",
                        content: { "application/json": { schema: { type: "object" } } }
                    }
                }
            }
        }
    }
};

return NextResponse.json(spec);
}
