'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('[Global Error Boundary]:', error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">Something went wrong!</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
                An error occurred while rendering this page. This often happens due to missing translation keys or hydration mismatches.
            </p>
            <div className="bg-muted p-4 rounded-md text-left mb-8 max-w-2xl overflow-auto border">
                <p className="font-mono text-sm whitespace-pre-wrap">{error.message || 'Unknown error'}</p>
                {error.stack && (
                    <details className="mt-4">
                        <summary className="cursor-pointer text-xs uppercase tracking-widest text-muted-foreground">Stack Trace</summary>
                        <pre className="mt-2 text-[10px] leading-tight text-muted-foreground">{error.stack}</pre>
                    </details>
                )}
            </div>
            <Button
                onClick={() => {
                    // Attempt to recover by trying to re-render the segment
                    reset();
                    window.location.reload();
                }}
            >
                Try again
            </Button>
        </div>
    );
}
