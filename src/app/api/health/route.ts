import { NextResponse } from "next/server";
import { CLUSTER, RPC_IS_PUBLIC_DEFAULT, SUPABASE_CONFIGURED } from "@/config/public-env";
import { getServerIntegrationFlags } from "@/config/server-env";

/** Integration status as booleans only. Never returns keys or values. */
export function GET() {
  return NextResponse.json(
    {
      cluster: CLUSTER,
      rpc: RPC_IS_PUBLIC_DEFAULT ? "public-default" : "custom",
      supabase: SUPABASE_CONFIGURED,
      ...getServerIntegrationFlags(),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
