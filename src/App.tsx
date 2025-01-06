import { createBrowserRouter, RouterProvider } from "react-router";
import {
  redirectUserToDashboard,
  retrieveForm,
  retrieveUser,
  retrieveUserAndForm,
} from "./lib/router";
import { Builder } from "./pages/Builder";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Toaster } from "react-hot-toast";
import { Form } from "./pages/Form";

const router = createBrowserRouter([
  { path: "/", element: <Dashboard />, loader: retrieveUser },
  { path: "/login", element: <Login />, loader: redirectUserToDashboard },
  { path: "/forms/:id", element: <Form />, loader: retrieveForm },
  {
    path: "/forms/:id/edit",
    element: <Builder />,
    loader: retrieveUserAndForm,
  },
]);

export function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
