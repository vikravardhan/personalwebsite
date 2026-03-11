import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

export default (() => {
  const WritingStreak: QuartzComponent = ({ allFiles, displayClass }: QuartzComponentProps) => {
    const writingFiles = (allFiles ?? []).filter(
      (f) => f.slug?.startsWith("writing/") && !f.slug.endsWith("index"),
    )

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

    const dateMap = new Map<string, number>()
    writingFiles.forEach((f) => {
      const date = f.dates?.published ?? f.dates?.created
      if (date) {
        const key = fmt(date)
        dateMap.set(key, (dateMap.get(key) ?? 0) + 1)
      }
    })

    const currentYear = new Date().getFullYear()
    const yearsInData = [...new Set([...dateMap.keys()].map((d) => parseInt(d.slice(0, 4))))]
    const years = [...new Set([currentYear, ...yearsInData])].sort((a, b) => b - a)

    const todayStr = fmt(new Date())
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const dayLabels = ["Mon", "", "Wed", "", "Fri", "", ""]

    const renderGrid = (year: number) => {
      const jan1 = new Date(year, 0, 1)
      const daysBack = (jan1.getDay() + 6) % 7
      const start = new Date(jan1)
      start.setDate(jan1.getDate() - daysBack)
      const dec31 = new Date(year, 11, 31)

      // First pass: collect all weeks to compute month label positions
      const weeksData: { dateStr: string; inYear: boolean; count: number; month: number }[][] = []
      const current = new Date(start)

      while (current <= dec31) {
        const days: typeof weeksData[0] = []
        for (let d = 0; d < 7; d++) {
          const dateStr = fmt(current)
          const inYear = current.getFullYear() === year
          const count = inYear ? (dateMap.get(dateStr) ?? 0) : 0
          days.push({ dateStr, inYear, count, month: current.getMonth() })
          current.setDate(current.getDate() + 1)
        }
        weeksData.push(days)
      }

      // Build month labels: find the first week where each month's Monday falls
      const monthLabels: { month: number; weekIndex: number }[] = []
      let lastMonth = -1
      for (let w = 0; w < weeksData.length; w++) {
        const monday = weeksData[w][0]
        if (monday.inYear && monday.month !== lastMonth) {
          lastMonth = monday.month
          monthLabels.push({ month: monday.month, weekIndex: w })
        }
      }

      const weeks = weeksData.map((week) => {
        const days = week.map(({ dateStr, inYear, count }) => {
          const level = !inYear || count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4
          const isToday = dateStr === todayStr
          return (
            <div
              class={`streak-day level-${level}${isToday ? " today" : ""}`}
              title={inYear ? `${dateStr}${count > 0 ? `: ${count} post${count !== 1 ? "s" : ""}` : ""}` : ""}
            />
          )
        })
        return <div class="streak-week">{days}</div>
      })

      const totalWeeks = weeks.length

      return (
        <div class="streak-grid-container">
          {/* Month labels row */}
          <div class="streak-month-row" style={`grid-template-columns: 28px repeat(${totalWeeks}, 1fr)`}>
            <div />
            {(() => {
              const cells: preact.JSX.Element[] = []
              for (let i = 0; i < monthLabels.length; i++) {
                const start = monthLabels[i].weekIndex
                const end = i + 1 < monthLabels.length ? monthLabels[i + 1].weekIndex : totalWeeks
                const span = end - start
                cells.push(
                  <span class="streak-month-label" style={`grid-column: span ${span}`}>
                    {monthNames[monthLabels[i].month]}
                  </span>,
                )
              }
              // Fill any leading empty weeks before first month label
              if (monthLabels.length > 0 && monthLabels[0].weekIndex > 0) {
                cells.unshift(
                  <span style={`grid-column: span ${monthLabels[0].weekIndex}`} />,
                )
              }
              return cells
            })()}
          </div>
          {/* Grid with day labels */}
          <div class="streak-grid-inner">
            <div class="streak-day-labels">
              {dayLabels.map((label) => (
                <span class="streak-day-label">{label}</span>
              ))}
            </div>
            <div class="streak-weeks" style={`grid-template-columns: repeat(${totalWeeks}, 1fr)`}>
              {weeks}
            </div>
          </div>
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
    .streak-grid-container {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .streak-month-row {
      display: grid;
      gap: 3px;
      font-size: 0.7rem;
      color: var(--gray);
    }
    .streak-month-label {
      text-align: left;
      overflow: hidden;
    }
    .streak-grid-inner {
      display: flex;
      gap: 4px;
    }
    .streak-day-labels {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex-shrink: 0;
      width: 24px;
    }
    .streak-day-label {
      font-size: 0.6rem;
      color: var(--gray);
      display: flex;
      align-items: center;
      flex: 1;
      line-height: 1;
    }
    .streak-weeks {
      display: grid;
      gap: 3px;
      flex: 1;
      min-width: 0;
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
    .streak-day.today {
      outline: 2px solid var(--darkgray);
      outline-offset: -1px;
      border-radius: 2px;
    }
    @media (max-width: 800px) {
      .streak-header {
        flex-wrap: wrap;
        gap: 0.4rem;
      }
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
