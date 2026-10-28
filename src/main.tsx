import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./index.css";
import { TRPCProvider } from "@/providers/trpc";
import App from "./App.tsx";

const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <TRPCProvider>
        <App />
      </TRPCProvider>
    ),
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
