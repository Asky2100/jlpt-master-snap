<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# JLPT Master Snap

Capture JLPT practice questions, run OCR, and let the AI tutor explain the answer paths. The app now supports a Vercel-hosted API proxy so end users can get started without bringing their own API keys, while advanced users can still plug in their own accounts from the UI settings.

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies: `npm install`
2. Decide how you want to provide model credentials:
   - **Server-proxy mode** (recommended for production): copy [.env.local](.env.local) and fill in `OCR_*` and `ANALYSIS_*` values, then run `vercel dev` so the `/api/*` routes are available locally.
   - **Bring-your-own-keys mode:** run `npm run dev`, open the in-app 设置面板, turn off “使用托管 API Key”，并填写自己的 Base URL、API Key 与模型名。
3. Start the UI only: `npm run dev` (uses the Vite dev server). To exercise the serverless routes locally, run `vercel dev` instead.

## Deploy on Vercel

1. Push this repository to GitHub/GitLab.
2. Import the project in [Vercel](https://vercel.com/new) as a Vite app (build command `npm run build`, output `dist`).
3. In the Vercel dashboard, configure the following Environment Variables (Preview + Production):
   - `OCR_BASE_URL`
   - `OCR_API_KEY`
   - `OCR_MODEL`
   - `ANALYSIS_BASE_URL`
   - `ANALYSIS_API_KEY`
   - `ANALYSIS_MODEL`
4. Redeploy. The `/api/ocr` and `/api/analyze` functions will now proxy requests with the secrets you provided. End users can toggle “使用托管 API Key” (default ON) to consume these shared credentials, or switch it OFF to run the app with their own API keys entirely in the browser.

## Notes

- When running locally without `vercel dev`, keep “使用托管 API Key” 关闭，否则 Vite dev server无法处理 `/api/*` 请求。
- If you change default settings, the UI resets local storage automatically via `SETTINGS_SIGNATURE`.
- The OCR and analysis endpoints expect OpenAI-compatible `/chat/completions` APIs.
