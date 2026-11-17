import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="container-page py-24">
      <EmptyState
        icon={<Compass />}
        title="Out of orbit"
        description="This page, token or community doesn't exist. Check the address or head back to Explore."
        action={
          <div className="flex gap-2">
            <ButtonLink href="/explore" variant="primary" size="sm">
              Explore tokens
            </ButtonLink>
            <ButtonLink href="/" size="sm">
              Home
            </ButtonLink>
          </div>
        }
      />
    </div>
  );
}
