import { PublicClientApplication } from "@azure/msal-browser";

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: "dbeffdf3-3295-44a1-bf73-6d91f0e06f67",
    authority: "https://login.microsoftonline.com/fb3b4fc0-26e3-4ae9-a908-63aa1b057dde",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
  },
});

export const loginRequest = {
  scopes: ["User.Read"],
};


// dbeffdf3-3295-44a1-bf73-6d91f0e06f67