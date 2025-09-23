SkinPulse - Complete minimal scaffold
===================================

This package contains a minimal full-stack version of SkinPulse suitable for testing and initial demonstrations.

How to run (on Render or locally):
1. Install dependencies:
   npm install
2. Start the server:
   npm start
3. Open http://localhost:10000 or the Render-provided URL.

Features included:
- Simple Express backend with endpoints:
  - GET /api/skins
  - GET /api/skins/:id
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/subscribe  (mock)
- Mock JSON data (data/*.json) to simulate DB.
- Frontend static SPA in /public with pages: Home, Skins, Plans, Dashboard, Login/Register.
- Subscriptions are mocked and stored in data/subscriptions.json.

Notes:
- This is a demo scaffold. Passwords are stored in plain text in the mock DB for testing only.
- For production, replace mock storage with a real DB and secure authentication (hashed passwords, JWTs).
