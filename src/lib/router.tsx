import { createBrowserRouter } from "react-router-dom";

import MenuEditor from "../pages/config/MenuEditor";
import FormEditor from "../pages/config/FormEditor";

export const router = createBrowserRouter([
    {
        path: "/config/menu",
        Component: MenuEditor,
    },
    {
        path: "/config/form",
        Component: FormEditor
    }
]);
