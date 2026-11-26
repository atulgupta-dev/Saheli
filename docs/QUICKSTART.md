# Saheli AI: start coding

Clone repository:
```bash
git clone https://github.com/atulgupta-dev/Saheli.git
cd Saheli
git fetch origin
git switch feature/frontend-experience   # replace with your assigned branch
```

Read `AGENTS.md` and `shared/api-contracts.md`. Each agent uses its own clone/worktree.

**Backend scaffold**
```bash
cd backend
python -m venv .venv
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Visit `http://localhost:8000/health`.

**Frontend**: M4 scaffolds Next.js in `frontend/` on their feature branch, then runs `npm install && npm run dev`. Avoid multiple agents initializing the same directory.

Copy example env files to untracked `.env` equivalents; never commit credentials. Server secret keys cannot be `NEXT_PUBLIC_` values.

Feature branch -> PR to `develop`; integration lead reviews/merges; final tested `develop` -> `main` PR.
