import { createBrowserRouter, Navigate } from "react-router-dom";

import type { ConfigRouteHandle } from "./route-handles";

import Analysis from "../../pages/config/Analysis";
import FormEditor from "../../pages/config/FormEditor";
import ConfigLayout from "../../pages/config/Layout";
import MenuEditor from "../../pages/config/MenuEditor";

export const router = createBrowserRouter([
    {
        path: "/config",
        Component: ConfigLayout,
        children: [
            {
                index: true,
                element: <Navigate to="menu" replace />
            },
            {
                path: "menu",
                Component: MenuEditor,
                handle: { title: "Menu Editor" } satisfies ConfigRouteHandle
            },
            {
                path: "form",
                Component: FormEditor,
                handle: { title: "Form Editor" } satisfies ConfigRouteHandle
            },
            {
                path: "analysis",
                Component: Analysis,
                handle: { title: "Analysis Editor" } satisfies ConfigRouteHandle
            }
        ]
    },
]);
