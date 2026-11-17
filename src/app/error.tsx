"use client";

import { CircleX, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-page py-24">
      <EmptyState
        icon={<CircleX />}
        title="Something went wrong"
        description="This page failed to render. No transaction was sent. Try again, and if it keeps happening, reload."
        action={
          <Button size="sm" onClick={reset}>
            <RefreshCw /> Try again
          </Button>
        }
      />
    </div>
  );
}
