import { GET as forecastHandler } from "@/app/api/forecast/route";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return forecastHandler(request);
}
