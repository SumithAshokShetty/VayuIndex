# Vayu Index Architecture

```mermaid
flowchart TB
  subgraph Browser[Browser · Next.js and React UI]
    Pages[App Router pages<br/>Home · Overview · Dashboard<br/>Compare · Health & Safety · Personal Risk · About]
    Shared[Shared layout<br/>Navbar · Ask Vayu drawer]
    Features[Feature components<br/>Maps and globe · AQI cards · forecasts<br/>comparison · health and exposure reports]
    BrowserAPIs[Browser capabilities<br/>Geolocation · localStorage · speech input/output]
    Pages --> Features
    Shared --> Pages
    BrowserAPIs --> Shared
  end

  subgraph Server[Next.js server · route handlers]
    AirAPI[/api/air-quality<br/>current readings/]
    ForecastAPI[/api/forecast<br/>and /api/air-quality/forecast/]
    HistoryAPI[/api/air-quality/history/]
    PlacesAPI[/api/geocode · /api/hotspots<br/>/api/stations · /api/weather/]
    AssistantAPI[/api/agent-reasoning<br/>streamed chat response/]
    CompareAPI[/api/compare-ai<br/>comparative insights/]
  end

  subgraph Services[Application services]
    Orchestrator[Air data orchestrator<br/>provider priority · freshness checks<br/>AQI calculation · short-lived cache]
    GroundTruth[Spatial city dataset<br/>known coordinates and fallback context]
    ForecastService[Forecast and history handlers<br/>time-series shaping]
    AgentGraph[LangGraph workflow<br/>Data Auditor → Trend Predictor<br/>Health Specialist → Executive Synthesis]
    AQI[AQI utilities<br/>CPCB and EPA scales · unit conversion]
  end

  subgraph Providers[External data and AI providers]
    CPCB[CPCB / data.gov.in]
    OpenAQ[OpenAQ station observations]
    WAQI[WAQI station index]
    CAMS[Copernicus CAMS via Open-Meteo<br/>modeled air quality and forecast]
    Weather[Open-Meteo weather and geocoding]
    Groq[Groq API<br/>GROQ_MODEL]
  end

  Pages -->|HTTP requests| AirAPI
  Features -->|HTTP requests| ForecastAPI
  Features -->|HTTP requests| HistoryAPI
  Features -->|HTTP requests| PlacesAPI
  Shared -->|question + page context| AssistantAPI
  Features -->|comparison context| CompareAPI

  AirAPI --> Orchestrator
  AssistantAPI --> Orchestrator
  AssistantAPI --> AgentGraph
  CompareAPI --> Groq
  AgentGraph --> Groq
  Orchestrator --> CPCB
  Orchestrator --> OpenAQ
  Orchestrator --> WAQI
  Orchestrator --> CAMS
  Orchestrator -. fallback context .-> GroundTruth
  Orchestrator --> AQI
  ForecastAPI --> ForecastService
  HistoryAPI --> ForecastService
  PlacesAPI --> Weather
  ForecastService --> CAMS
  ForecastService --> CPCB
```

## Request paths

- **Current air:** the UI sends coordinates to `/api/air-quality`. The orchestrator prefers CPCB for Indian locations, then OpenAQ, WAQI, and a CAMS/Open-Meteo model estimate; it uses the spatial dataset as fallback context where available.
- **Forecasts and history:** dedicated route handlers fetch and shape time-series data for forecast, comparison, and reporting views.
- **Ask Vayu:** the shared drawer sends the question and relevant page context to `/api/agent-reasoning`. That route resolves explicitly named places, retrieves air data, and streams a LangGraph synthesis generated with Groq.
- **Personalization:** the browser can provide location and speech capabilities. Theme and selected location preferences are stored locally; this app does not show a central application database in these request paths.
