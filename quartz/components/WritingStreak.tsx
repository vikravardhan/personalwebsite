import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

export default (() => {
  const WritingStreak: QuartzComponent = ({ allFiles, displayClass }: QuartzComponentProps) => {
    const writingFiles = (allFiles ?? []).filter(
      (f) => f.slug?.startsWith("writing/") && !f.slug.endsWith("index"),
    )

    const dateMap = new Map<string, number>()
    writingFiles.forEach((f) => {
      const date = f.dates?.published ?? f.dates?.created
      if (date) {
        const key = date.toISOString().split("T")[0]
        dateMap.set(key, (dateMap.get(key) ?? 0) + 1)
      }
    })

    const currentYear = new Date().getFullYear()
    const yearsInData = [...new Set([...dateMap.keys()].map((d) => parseInt(d.slice(0, 4))))]
    const years = [...new Set([currentYear, ...yearsInData])].sort((a, b) => b - a)

    const renderGrid = (year: number) => {
      const jan1 = new Date(year, 0, 1)
      const daysBack = (jan1.getDay() + 6) % 7
      const start = new Date(jan1)
      start.setDate(jan1.getDate() - daysBack)
      const dec31 = new Date(year, 11, 31)

      const weeks = []
      const current = new Date(start)

      while (current <= dec31) {
        const days = []
        for (let d = 0; d < 7; d++) {
          const dateStr = current.toISOString().split("T")[0]
          const inYear = current.getFullYear() === year
          const count = inYear ? (dateMap.get(dateStr) ?? 0) : 0
          const level = !inYear || count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4
          days.push(
            <div
              class={`streak-day level-${level}`}
              title={inYear ? `${dateStr}${count > 0 ? `: ${count} post${count !== 1 ? "s" : ""}` : ""}` : ""}
            />,
          )
          current.setDate(current.getDate() + 1)
        }
        weeks.push(<div class="streak-week">{days}</div>)
      }

      return (
        <div class="streak-weeks" style={`grid-template-columns: repeat(${weeks.length}, 1fr)`}>
          {weeks}
        </div>
      )
    }

    return (
      <div class={classNames(displayClass, "writing-streak")}>
        <div class="streak-header">
          <span class="streak-label">{writingFiles.length} post{writingFiles.length !== 1 ? "s" : ""}</span>
          <div class="streak-year-tabs">
            {years.map((year, i) => (
              <button class={`streak-tab${i === 0 ? " active" : ""}`} data-year={String(year)}>
                {year}
              </button>
            ))}
          </div>
        </div>
        {years.map((year, i) => (
          <div class={`streak-grid${i === 0 ? " active" : ""}`} data-year={String(year)}>
            {renderGrid(year)}
          </div>
        ))}
      </div>
    )
  }

  WritingStreak.css = `
    .writing-streak {
      margin: 1.5rem 0 2rem;
    }
    .streak-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.6rem;
    }
    .streak-label {
      font-size: 0.85rem;
      color: var(--gray);
    }
    .streak-year-tabs {
      display: flex;
      gap: 0.4rem;
    }
    .streak-tab {
      padding: 0.15rem 0.55rem;
      border: 1px solid var(--lightgray);
      border-radius: 4px;
      background: none;
      color: var(--gray);
      cursor: pointer;
      font-size: 0.8rem;
      font-family: var(--bodyFont);
      transition: all 0.15s ease;
    }
    .streak-tab.active {
      background: var(--secondary);
      color: var(--light);
      border-color: var(--secondary);
    }
    .streak-tab:hover:not(.active) {
      border-color: var(--gray);
      color: var(--darkgray);
    }
    .streak-grid {
      display: none;
    }
    .streak-grid.active {
      display: block;
    }
    .streak-weeks {
      display: grid;
      gap: 3px;
      width: 100%;
    }
    .streak-week {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .streak-day {
      aspect-ratio: 1;
      width: 100%;
      border-radius: 2px;
      background: var(--lightgray);
    }
    .streak-day.level-1 { background: #0e4429; }
    .streak-day.level-2 { background: #006d32; }
    .streak-day.level-3 { background: #26a641; }
    .streak-day.level-4 { background: #39d353; }
    [saved-theme="light"] .streak-day.level-1 { background: #9be9a8; }
    [saved-theme="light"] .streak-day.level-2 { background: #40c463; }
    [saved-theme="light"] .streak-day.level-3 { background: #30a14e; }
    [saved-theme="light"] .streak-day.level-4 { background: #216e39; }
  `

  WritingStreak.afterDOMLoaded = `
    document.querySelectorAll(".streak-tab").forEach(function(tab) {
      tab.addEventListener("click", function() {
        var year = tab.getAttribute("data-year");
        var container = tab.closest(".writing-streak");
        container.querySelectorAll(".streak-tab").forEach(function(t) { t.classList.remove("active"); });
        container.querySelectorAll(".streak-grid").forEach(function(g) { g.classList.remove("active"); });
        tab.classList.add("active");
        var grid = container.querySelector('.streak-grid[data-year="' + year + '"]');
        if (grid) grid.classList.add("active");
      });
    });
  `

  return WritingStreak
}) satisfies QuartzComponentConstructor
