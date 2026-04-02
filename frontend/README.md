# CodeCure Frontend

Next.js + Tailwind CSS dashboard for global COVID visualization and forecasting.

## Features

- Global interactive COVID heatmap built with Leaflet
- Prediction panel connected to backend API at `http://localhost:8080`
- Forecast chart rendered with Recharts
- Region details including:
  - Region name
  - Last known cases
  - Forecasted daily new cases over time
- Responsive layout with reusable components

## Tech Stack

- Next.js (App Router)
- Tailwind CSS v4
- Leaflet (map + heat-style intensity circles)
- Recharts (time-series forecast chart)

## API Contract Used

The dashboard expects forecast responses in this shape:

```python
class DayForecast:
		date: date
		predicted_new_cases: int

class ForecastResponse:
		region: str
		horizon_days: int
		last_known_date: date
		last_known_cases: int
		forecast: list[DayForecast]
```

Frontend endpoints used:

- `GET /health`
- `GET /regions`
- `POST /forecast` with body `{ "region": string, "horizon": number }`

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Ensure backend is running at `http://localhost:8080`.

3. (Optional) Set a custom API base URL:

```bash
echo 'NEXT_PUBLIC_API_URL=http://localhost:8080' > .env.local
```

4. Start the frontend:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
```

## Project Structure

- `app/page.tsx`: dashboard container and orchestration
- `components/CovidMap.tsx`: global map and intensity visualization
- `components/ForecastChart.tsx`: forecast chart and KPI cards
- `components/MapSidebar.tsx`: controls + forecast details panel
- `lib/api.ts`: backend API service and typed responses
- `lib/countryCoords.ts`: country-to-coordinate lookup
