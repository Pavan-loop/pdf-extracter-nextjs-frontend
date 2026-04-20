# DocMadara — PDF Intelligence Frontend

Next.js 14 frontend for the PDF extraction SaaS platform.

## Stack
- **Next.js 14** (App Router) — JavaScript only
- **Axios** — API client with JWT interceptor
- **@stomp/stompjs + sockjs-client** — WebSocket real-time results
- **react-dropzone** — Drag & drop PDF upload
- **js-cookie** — JWT token management
- **date-fns** — Date formatting

## Prerequisites
- Node.js 18+
- Spring Boot backend running on `http://localhost:8081`
- Python worker + Kafka running (for AI extraction)

## Setup

```bash
npm install
npm run dev
```

App starts at **http://localhost:3000**

## Environment
`.env.local` is pre-configured for local development:
```
NEXT_PUBLIC_API_BASE=http://localhost:8081
NEXT_PUBLIC_WS_URL=http://localhost:8081/ws
```

## Pages

| Route | Description |
|---|---|
| `/login` | Email/password + Google OAuth login |
| `/register` | User registration |
| `/oauth2/callback` | Google OAuth redirect handler |
| `/dashboard` | Stats overview + recent results |
| `/dashboard/upload` | Drag-and-drop PDF upload + live WebSocket results |
| `/dashboard/results` | Browse all extraction results with data viewer |
| `/dashboard/sessions` | Create and manage document sessions |

## API Endpoints Used

| Endpoint | Method | Description |
|---|---|---|
| `/auth/login` | POST | JWT login |
| `/auth/register?role=USER` | POST | Register |
| `/dashboard` | GET | Dashboard card stats |
| `/pdf/upload` | POST | Upload PDFs (multipart) |
| `/pdf/my-results` | GET | All user results |
| `/pdf/result/:jobId` | GET | Single result poll |
| `/session` | POST | Create session |
| `ws://localhost:8081/ws` | WebSocket | Live push results |

## Auth Flow
1. POST `/auth/login` → receive JWT token
2. Token stored in `cookie` (7 day expiry)
3. All API requests include `Authorization: Bearer <token>`
4. WebSocket CONNECT includes `Authorization: Bearer <token>` header
5. Results pushed to `/user/queue/results` via STOMP

## Folder Structure
```
app/
  layout.js              # Root layout + AuthProvider
  page.js                # Redirect / → /dashboard or /login
  login/                 # Login page
  register/              # Register page
  oauth2/callback/       # Google OAuth handler
  dashboard/
    layout.js            # Protected layout + Sidebar
    page.js              # Dashboard overview
    upload/              # PDF upload + WebSocket
    results/             # Extraction results viewer
    sessions/            # Session management

components/
  layout/Sidebar.js      # Navigation sidebar

context/
  AuthContext.js         # JWT auth state + login/logout

lib/
  api.js                 # Axios client + all API calls
  websocket.js           # STOMP WebSocket client
```
