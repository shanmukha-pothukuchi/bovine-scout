import { RouterProvider } from "react-router-dom";
import { router } from "@/lib/router";
import { ThemeProvider } from "@/components/theme-provider";

export function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
