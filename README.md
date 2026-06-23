# Desktop Pet

A cross-platform productivity companion built with tasks and Google Workspace data.

## Running the app

Install dependencies:

```bash
npm install
```

Start the Vite renderer in one terminal:

```bash
npm run dev
```

Start Electron in another terminal:

```bash
npm run start
```

The Vite dev server must be running before Electron opens the renderer URL.

## Google API setup

Google API integration is optional for the core desktop pet features.

To test Google features:

1. Enable Gmail API, Google Calendar API, and Google Tasks API in Google Cloud.
2. Configure the OAuth consent screen.
3. Add your Google account as a test user while the app is in Testing mode.
4. Create an OAuth Client ID using application type `Desktop app`.
5. Download the credentials JSON and rename it to `google-oauth-client.json`.
6. Place it where your `googleClient.js` expects it.
