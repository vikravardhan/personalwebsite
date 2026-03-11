import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import fs from "fs"
import path from "path"

interface Recommendation {
  title: string
  type: string
  year: string
  link: string | null
}

export function loadRecommendationsData(): Recommendation[] {
  const dataPath = path.join(process.cwd(), "content", "recommendations", "data.json")
  if (!fs.existsSync(dataPath)) return []
  return JSON.parse(fs.readFileSync(dataPath, "utf-8"))
}

export default (() => {
  const Recommendations: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    const data = loadRecommendationsData()
    if (data.length === 0) return null

    const types = [...new Set(data.map((r) => r.type))].sort()
    const years = [...new Set(data.map((r) => r.year))].sort((a, b) => b.localeCompare(a))

    return (
      <div class={classNames(displayClass, "recommendations")}>
        <div class="rec-filters">
          <div class="rec-filter-group">
            <button class="rec-filter-btn active" data-filter="all" data-filter-type="type">
              All
            </button>
            {types.map((type) => (
              <button class="rec-filter-btn" data-filter={type} data-filter-type="type">
                {type}
              </button>
            ))}
          </div>
          <div class="rec-filter-group rec-year-filters">
            <button class="rec-filter-btn active" data-filter="all" data-filter-type="year">
              All Years
            </button>
            {years.map((year) => (
              <button class="rec-filter-btn" data-filter={year} data-filter-type="year">
                {year}
              </button>
            ))}
          </div>
        </div>
        <div class="rec-grid">
          {data.map((rec) => (
            <div class="rec-card" data-type={rec.type} data-year={rec.year}>
              <span class="rec-type">{rec.type}</span>
              <h4 class="rec-title">
                {rec.link ? (
                  <a href={rec.link} target="_blank" rel="noopener noreferrer">
                    {rec.title}
                  </a>
                ) : (
                  rec.title
                )}
              </h4>
              <span class="rec-year">{rec.year}</span>
            </div>
          ))}
        </div>
        <div class="rec-empty" style="display: none;">
          No recommendations match the selected filters.
        </div>
      </div>
    )
  }

  Recommendations.css = `
    .recommendations {
      margin-top: 1.5rem;
    }
    .rec-filters {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .rec-filter-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .rec-filter-btn {
      background: transparent;
      border: 1px solid var(--lightgray);
      border-radius: 2rem;
      padding: 0.3rem 0.75rem;
      font-size: 0.8rem;
      color: var(--darkgray);
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }
    .rec-filter-btn:hover {
      border-color: var(--secondary);
      color: var(--secondary);
    }
    .rec-filter-btn.active {
      background: var(--secondary);
      border-color: var(--secondary);
      color: var(--light);
    }
    .rec-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
      gap: 0.75rem;
    }
    .rec-card {
      border: 1px solid var(--lightgray);
      border-radius: 0.5rem;
      padding: 1rem;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .rec-card:hover {
      border-color: var(--secondary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
    .rec-card.hidden {
      display: none;
    }
    .rec-type {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--secondary);
      font-weight: 600;
    }
    .rec-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 500;
      line-height: 1.3;
    }
    .rec-title a {
      color: var(--dark);
      text-decoration: underline;
      font-weight: 400;
    }
    .rec-title a:hover {
      color: var(--secondary);
    }
    .rec-year {
      font-size: 0.75rem;
      color: var(--gray);
      margin-top: auto;
    }
    .rec-empty {
      text-align: center;
      color: var(--gray);
      padding: 2rem;
      font-size: 0.9rem;
    }
  `

  Recommendations.afterDOMLoaded = `
    document.addEventListener("nav", () => {
      const container = document.querySelector(".recommendations")
      if (container) {
        let activeType = "all"
        let activeYear = "all"

        const cards = container.querySelectorAll(".rec-card")
        const emptyMsg = container.querySelector(".rec-empty")

        function applyFilters() {
          let visible = 0
          cards.forEach(card => {
            const matchType = activeType === "all" || card.dataset.type === activeType
            const matchYear = activeYear === "all" || card.dataset.year === activeYear
            const show = matchType && matchYear
            card.classList.toggle("hidden", !show)
            if (show) visible++
          })
          if (emptyMsg) emptyMsg.style.display = visible === 0 ? "block" : "none"
        }

        container.querySelectorAll(".rec-filter-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const filterType = btn.dataset.filterType
            const value = btn.dataset.filter

            // Update active state within same group
            const group = btn.closest(".rec-filter-group")
            group.querySelectorAll(".rec-filter-btn").forEach(b => b.classList.remove("active"))
            btn.classList.add("active")

            if (filterType === "type") activeType = value
            else activeYear = value

            applyFilters()
          })
        })
      }
    })
  `

  return Recommendations
}) satisfies QuartzComponentConstructor
