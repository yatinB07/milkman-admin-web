# MilkMan Admin Docker

This Docker setup runs only the React admin frontend.

```bash
docker compose up --build
```

URL:

- Admin: http://localhost:5173

Configuration:

- Vite reads frontend environment values from this app.
- Set `VITE_API_BASE_URL` when the backend API is not available at `http://localhost:8000`.
- Example local `.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

Startup runs:

```bash
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

Useful commands:

```bash
docker compose ps
docker compose logs -f admin
docker compose down
```
