/**
 * Fetch recommendations from a Notion database and write to content/recommendations/data.json
 *
 * Required env vars:
 *   NOTION_API_KEY
 *
 * Usage:
 *   npx tsx scripts/fetch-notion.ts
 */

import fs from "fs"
import path from "path"

const NOTION_API = "https://api.notion.com/v1"
const DATABASE_ID = "b66407ab4bf24db9996ad935bc0bcd77"

interface NotionRichText {
  plain_text: string
}

interface NotionPage {
  properties: {
    Title?: { title: NotionRichText[] }
    Type?: { select: { name: string } | null }
    Year?: { select: { name: string } | null }
    Link?: { url: string | null }
  }
}

interface Recommendation {
  title: string
  type: string
  year: string
  link: string | null
}

async function fetchAllPages(apiKey: string): Promise<NotionPage[]> {
  const pages: NotionPage[] = []
  let cursor: string | undefined

  while (true) {
    const body: Record<string, unknown> = { page_size: 100 }
    if (cursor) body.start_cursor = cursor

    const res = await fetch(`${NOTION_API}/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Notion query failed (${res.status}): ${text}`)
    }

    const data = (await res.json()) as { results: NotionPage[]; has_more: boolean; next_cursor?: string }
    pages.push(...data.results)

    if (!data.has_more) break
    cursor = data.next_cursor
  }

  return pages
}

function extractRecommendation(page: NotionPage): Recommendation | null {
  const title = page.properties.Title?.title?.map((t) => t.plain_text).join("") ?? ""
  if (!title) return null

  return {
    title,
    type: page.properties.Type?.select?.name ?? "Other",
    year: page.properties.Year?.select?.name ?? "Unknown",
    link: page.properties.Link?.url ?? null,
  }
}

async function main() {
  const apiKey = process.env.NOTION_API_KEY
  if (!apiKey) throw new Error("Missing NOTION_API_KEY env var")

  console.log("Fetching recommendations from Notion...")
  const pages = await fetchAllPages(apiKey)

  const recommendations = pages
    .map(extractRecommendation)
    .filter((r): r is Recommendation => r !== null)
    .sort((a, b) => a.title.localeCompare(b.title))

  const outDir = path.join(process.cwd(), "content", "recommendations")
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const outPath = path.join(outDir, "data.json")
  fs.writeFileSync(outPath, JSON.stringify(recommendations, null, 2) + "\n")
  console.log(`Wrote ${recommendations.length} recommendations to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
