import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { checkEnvironmentVariables } from './utils/envCheck';

// Verify environment variables are loaded on startup
console.log('🚀 Bishma OS starting...');
console.log('Environment:', import.meta.env.MODE);
const envCheck = checkEnvironmentVariables();

if (!envCheck.isValid) {
  console.error('⚠️ Application starting with missing environment variables');
  console.error('Some features may not work correctly');
}

createRoot(document.getElementById("root")!).render(<App />);
