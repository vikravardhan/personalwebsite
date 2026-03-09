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

async function fetchWorkoutsSince(accessToken: string, since: string): Promise<WhoopWorkout[]> {
  const allWorkouts: WhoopWorkout[] = []
  let nextToken: string | undefined

  while (true) {
    const params = new URLSearchParams({ limit: "25", start: since })
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

  return allWorkouts
}

function durationMins(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
}

interface Workout {
  id: number
  date: string
  sport: string
  strain: number
  duration_mins: number
  calories: number
  avg_hr: number
  max_hr: number
}

function toWorkout(w: WhoopWorkout): Omit<Workout, "id"> {
  return {
    date: w.start.split("T")[0],
    sport: SPORT_NAMES[w.sport_id] ?? "Activity",
    strain: Math.round((w.score?.strain ?? 0) * 10) / 10,
    duration_mins: durationMins(w.start, w.end),
    calories: Math.round((w.score?.kilojoule ?? 0) / 4.184),
    avg_hr: w.score?.average_heart_rate ?? 0,
    max_hr: w.score?.max_heart_rate ?? 0,
  }
}

async function main() {
  const outPath = path.join(process.cwd(), "content", "workouts", "data.json")

  // Load existing workouts
  let existing: Workout[] = []
  if (fs.existsSync(outPath)) {
    existing = JSON.parse(fs.readFileSync(outPath, "utf-8")) as Workout[]
  }

  console.log("Refreshing Whoop access token...")
  const { accessToken, refreshToken: newRefreshToken } = await refreshAccessToken()

  // Write new refresh token to GitHub Actions output so the workflow can update the secret
  const ghOutput = process.env.GITHUB_OUTPUT
  if (ghOutput && newRefreshToken !== process.env.WHOOP_REFRESH_TOKEN) {
    fs.appendFileSync(ghOutput, `new_refresh_token=${newRefreshToken}\n`)
    console.log("Refresh token rotated — will update secret.")
  }

  // Fetch only workouts newer than the latest existing entry
  const latestDate = existing[0]?.date
  const since = latestDate
    ? new Date(latestDate + "T00:00:00.000Z").toISOString()
    : new Date(Date.now() - 14 * 86400000).toISOString() // fallback: last 14 days

  console.log(`Fetching workouts since ${since}...`)
  const raw = await fetchWorkoutsSince(accessToken, since)

  if (raw.length === 0) {
    console.log("No new workouts found.")
    return
  }

  const newWorkouts = raw.map((w) => toWorkout(w))

  // Deduplicate by date+sport+duration to avoid re-adding existing entries
  const existingKeys = new Set(existing.map((w) => `${w.date}|${w.sport}|${w.duration_mins}`))
  const unique = newWorkouts.filter((w) => !existingKeys.has(`${w.date}|${w.sport}|${w.duration_mins}`))

  if (unique.length === 0) {
    console.log("All fetched workouts already exist. No changes.")
    return
  }

  // Prepend new workouts (newest first), keep only the 10 most recent, and re-number IDs
  const merged = [...unique, ...existing].slice(0, 10).map((w, i) => ({ ...w, id: i + 1 }))

  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2) + "\n")
  console.log(`Added ${unique.length} new workout(s). Total: ${merged.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
