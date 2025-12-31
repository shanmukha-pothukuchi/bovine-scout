import { createBrowserRouter, Navigate } from "react-router-dom";

import ConfigLayout from "../pages/config/ConfigLayout";
import MenuEditor from "../pages/config/MenuEditor";
import FormEditor from "../pages/config/FormEditor";

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
            },
            {
                path: "form",
                Component: FormEditor
            }
        ]
    },
]);
