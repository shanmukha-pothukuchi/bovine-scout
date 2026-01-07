import { createBrowserRouter, Navigate } from "react-router-dom";

import type { ConfigRouteHandle } from "./route-handles";

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
                handle: { title: "Menu Editor", step: "Step 1: Define Menu Structure" } satisfies ConfigRouteHandle
            },
            {
                path: "form",
                Component: FormEditor,
                handle: { title: "Form Editor", step: "Step 2: Create Necessary Forms " } satisfies ConfigRouteHandle
            }
        ]
    },
]);
