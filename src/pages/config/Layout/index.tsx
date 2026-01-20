import { Outlet, useMatches } from "react-router-dom";
import type { ConfigRouteHandle } from "@/lib/router";


export default function Layout() {
    const matches = useMatches();

    const currentHandle = matches.at(-1)?.handle as ConfigRouteHandle | undefined;

    return (
        <div className="flex flex-col h-dvh">
            <div className="flex-1 overflow-y-auto">
                <Outlet />
            </div>
            <div className="border-t border-border bg-sidebar p-2.5">
                <p className="text-center text-sm">{currentHandle?.title}</p>
            </div>
        </div>
    );
}