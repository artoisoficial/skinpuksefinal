SkinPulse complete (FastAPI backend + Frontend PT/EN)

Quick deploy (single-step):
1. Extract and upload all files to your GitHub repo root.
2. On Render: New -> Web Service -> Connect repo ->
   - Build: pip install -r backend/requirements.txt
   - Start: uvicorn main:app --host 0.0.0.0 --port $PORT --app-dir backend
   - Branch: main
   - Plan: Free
3. Deploy and open the Render URL.

Notes: This is a test scaffold. Auth and payments are mocked. Language toggle available (PT/EN).
