/**
 * Fetch recent workouts from the Whoop API and write to content/workouts/data.json
 *
 * Required env vars:
 *   WHOOP_CLIENT_ID
 *   WHOOP_CLIENT_SECRET
 *   WHOOP_REFRESH_TOKEN
 *
 * Usage:
 *   npx tsx scripts/fetch-whoop.ts
 */

import fs from "fs"
import path from "path"

const WHOOP_API = "https://api.prod.whoop.com/developer"
const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token"

interface WhoopWorkout {
  id: number
  start: string
  end: string
  sport_id: number
  score_state: string
  score?: {
    strain: number
    average_heart_rate: number
    max_heart_rate: number
    kilojoule: number
    distance_meter?: number
  }
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

// Map common Whoop sport IDs to readable names
const SPORT_NAMES: Record<number, string> = {
  0: "Running",
  1: "Cycling",
  16: "Running",
  17: "Cycling",
  22: "Yoga",
  23: "HIIT",
  25: "Strength Training",
  27: "Swimming",
  33: "CrossFit",
  43: "Functional Fitness",
  44: "Strength Training",
  48: "Rowing",
  52: "Pilates",
  55: "Hiking",
  56: "Walking",
  63: "Stretching",
  71: "Weightlifting",
  84: "Spinning",
  "-1": "Activity",
}

async function refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string }> {
  const clientId = process.env.WHOOP_CLIENT_ID
  const clientSecret = process.env.WHOOP_CLIENT_SECRET
  const refreshToken = process.env.WHOOP_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET, or WHOOP_REFRESH_TOKEN")
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token refresh failed (${res.status}): ${text}`)
  }

  const data = (await res.json()) as TokenResponse
  return { accessToken: data.access_token, refreshToken: data.refresh_token }
}

async function fetchWorkouts(accessToken: string): Promise<WhoopWorkout[]> {
  const allWorkouts: WhoopWorkout[] = []
  let nextToken: string | undefined

  // Fetch enough pages to get 25 scored workouts
  while (allWorkouts.length < 25) {
    const params = new URLSearchParams({ limit: "25" })
    if (nextToken) params.set("nextToken", nextToken)

    const res = await fetch(`${WHOOP_API}/v2/activity/workout?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Workout fetch failed (${res.status}): ${text}`)
    }

    const data = (await res.json()) as { records: WhoopWorkout[]; next_token?: string }
    const scored = data.records.filter((w) => w.score_state === "SCORED" && w.score)
    allWorkouts.push(...scored)

    if (!data.next_token) break
    nextToken = data.next_token
  }

  return allWorkouts.slice(0, 25)
}

function durationMins(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
}

async function main() {
  console.log("Refreshing Whoop access token...")
  const { accessToken, refreshToken: newRefreshToken } = await refreshAccessToken()

  // Write new refresh token to GitHub Actions output so the workflow can update the secret
  const ghOutput = process.env.GITHUB_OUTPUT
  if (ghOutput && newRefreshToken !== process.env.WHOOP_REFRESH_TOKEN) {
    fs.appendFileSync(ghOutput, `new_refresh_token=${newRefreshToken}\n`)
    console.log("Refresh token rotated — will update secret.")
  }

  console.log("Fetching workouts...")
  const raw = await fetchWorkouts(accessToken)

  const workouts = raw.map((w, i) => ({
    id: i + 1,
    date: w.start.split("T")[0],
    sport: SPORT_NAMES[w.sport_id] ?? "Activity",
    strain: Math.round((w.score?.strain ?? 0) * 10) / 10,
    duration_mins: durationMins(w.start, w.end),
    calories: Math.round((w.score?.kilojoule ?? 0) / 4.184),
    avg_hr: w.score?.average_heart_rate ?? 0,
    max_hr: w.score?.max_heart_rate ?? 0,
  }))

  const outPath = path.join(process.cwd(), "content", "workouts", "data.json")
  fs.writeFileSync(outPath, JSON.stringify(workouts, null, 2) + "\n")
  console.log(`Wrote ${workouts.length} workouts to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
