import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { checkEnvironmentVariables } from './utils/envCheck';
import { ClerkProvider } from "@clerk/clerk-react";

// Verify environment variables are loaded on startup
console.log('🚀 Bishma OS starting...');
console.log('Environment:', import.meta.env.MODE);
const envCheck = checkEnvironmentVariables();

if (!envCheck.isValid) {
  console.error('⚠️ Application starting with missing environment variables');
  console.error('Some features may not work correctly');
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>
);
