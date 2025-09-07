import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://eaa5a251dff51cd6d3b3e4eb7727e1e2@o4509976569708544.ingest.de.sentry.io/4509976658182224",
  environment: import.meta.env.MODE || "development",
  debug: import.meta.env.MODE === "development",

  // Performance monitoring
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^\//],

  // Session tracking
  autoSessionTracking: true,

  // Enhanced context
  sendDefaultPii: true,

  integrations: [Sentry.replayIntegration()],

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Custom error filtering
  beforeSend(event) {
    // Add authentication context to all events
    if (typeof window !== "undefined") {
      const authState = {
        hasUser: !!window.__AUTH_USER__,
        hasProfile: !!window.__AUTH_PROFILE__,
        isLoading: !!window.__AUTH_LOADING__,
        timestamp: Date.now(),
      };

      event.contexts = event.contexts || {};
      event.contexts.auth = authState;
    }

    return event;
  },

  // Tag all events with auth-related tags
  initialScope: {
    tags: {
      component: "campus-connect",
      feature: "authentication",
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
