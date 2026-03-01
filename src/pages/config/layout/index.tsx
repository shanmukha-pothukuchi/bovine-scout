import { Outlet, useMatches } from "react-router-dom";
import type { ConfigRouteHandle } from "@/lib/router";
import { ConfigProvider } from "../context";

export default function Layout() {
  const matches = useMatches();

  const currentHandle = matches.at(-1)?.handle as ConfigRouteHandle | undefined;

  return (
    <ConfigProvider>
      <div className="flex flex-col h-dvh">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
        <div className="flex items-center justify-center border-t border-border bg-sidebar h-11.25">
          <p className="text-center text-sm font-medium">
            {currentHandle?.title}
          </p>
        </div>
      </div>
    </ConfigProvider>
  );
}
