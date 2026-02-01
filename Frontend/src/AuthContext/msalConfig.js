import { PublicClientApplication } from "@azure/msal-browser";

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: "dbeffdf3-3295-44a1-bf73-6d91f0e06f67",
    authority: "https://login.microsoftonline.com/fb3b4fc0-26e3-4ae9-a908-63aa1b057dde",
    redirectUri: "http://localhost:5173", // Vite default port
    postLogoutRedirectUri: "http://localhost:5173",
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false, // Better for browsers
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 2: // Error
            console.error(message);
            break;
          case 1: // Warning
            console.warn(message);
            break;
          case 0: // Info
          default:
            console.log(message);
            break;
        }
      },
      logLevel: 1, // Show warnings and errors only
    },
    tokenRenewalOffsetSeconds: 300,
    navigateFrameWait: 500,
    popupRedirectTimeout: 15000, // 15 seconds
    iframeHashTimeout: 10000,
    allowNativeBroker: false, // Disable native broker for web
  },
});

export const loginRequest = {
  scopes: ["User.Read"],
};

// dbeffdf3-3295-44a1-bf73-6d91f0e06f67