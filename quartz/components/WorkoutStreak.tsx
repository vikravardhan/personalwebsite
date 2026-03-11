import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import fs from "fs"
import path from "path"

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

export function loadWorkoutData(): Workout[] {
  const dataPath = path.join(process.cwd(), "content", "workouts", "data.json")
  try {
    return JSON.parse(fs.readFileSync(dataPath, "utf-8"))
  } catch {
    return []
  }
}

function loadStreakDates(): string[] {
  const streakPath = path.join(process.cwd(), "content", "workouts", "streak.json")
  try {
    return JSON.parse(fs.readFileSync(streakPath, "utf-8"))
  } catch {
    return []
  }
}

export default (() => {
  const WorkoutStreak: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    const streakDates = loadStreakDates()

    // Build date set for streak
    const dateSet = new Set(streakDates)

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

    const currentYear = new Date().getFullYear()
    const yearsInData = [...new Set(streakDates.map((d) => parseInt(d.slice(0, 4))))]
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

      const weeksData: { dateStr: string; inYear: boolean; hasWorkout: boolean; month: number }[][] = []
      const current = new Date(start)

      while (current <= dec31) {
        const days: typeof weeksData[0] = []
        for (let d = 0; d < 7; d++) {
          const dateStr = fmt(current)
          const inYear = current.getFullYear() === year
          const hasWorkout = inYear && dateSet.has(dateStr)
          days.push({ dateStr, inYear, hasWorkout, month: current.getMonth() })
          current.setDate(current.getDate() + 1)
        }
        weeksData.push(days)
      }

      // Build month labels
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
        const days = week.map(({ dateStr, inYear, hasWorkout }) => {
          const isToday = dateStr === todayStr
          return (
            <div
              class={`workout-day${hasWorkout ? " active" : ""}${isToday ? " today" : ""}`}
              title={inYear ? `${dateStr}${hasWorkout ? ": Workout" : ""}` : ""}
            />
          )
        })
        return <div class="workout-week">{days}</div>
      })

      const totalWeeks = weeks.length

      return (
        <div class="workout-grid-container">
          <div class="workout-month-row" style={`grid-template-columns: 28px repeat(${totalWeeks}, 1fr)`}>
            <div />
            {(() => {
              const cells: preact.JSX.Element[] = []
              for (let i = 0; i < monthLabels.length; i++) {
                const start = monthLabels[i].weekIndex
                const end = i + 1 < monthLabels.length ? monthLabels[i + 1].weekIndex : totalWeeks
                const span = end - start
                cells.push(
                  <span class="workout-month-label" style={`grid-column: span ${span}`}>
                    {monthNames[monthLabels[i].month]}
                  </span>,
                )
              }
              if (monthLabels.length > 0 && monthLabels[0].weekIndex > 0) {
                cells.unshift(
                  <span style={`grid-column: span ${monthLabels[0].weekIndex}`} />,
                )
              }
              return cells
            })()}
          </div>
          <div class="workout-grid-inner">
            <div class="workout-day-labels">
              {dayLabels.map((label) => (
                <span class="workout-day-label">{label}</span>
              ))}
            </div>
            <div class="workout-weeks" style={`grid-template-columns: repeat(${totalWeeks}, 1fr)`}>
              {weeks}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div class={classNames(displayClass, "workout-streak")}>
        <div class="streak-header">
          <span class="streak-label">
            {(() => {
              const y = years[0]
              const count = streakDates.filter((d) => d.startsWith(String(y))).length
              const now = new Date()
              const yearStart = new Date(y, 0, 1)
              const yearEnd = new Date(y, 11, 31)
              const end = now.getFullYear() === y ? now : yearEnd
              const days = Math.floor((end.getTime() - yearStart.getTime()) / 86400000) + 1
              return `${count} workout${count !== 1 ? "s" : ""} in ${days} days in ${y}`
            })()}
          </span>
          <div class="streak-year-tabs">
            {years.map((year, i) => {
              const count = streakDates.filter((d) => d.startsWith(String(year))).length
              const now = new Date()
              const yearStart = new Date(year, 0, 1)
              const yearEnd = new Date(year, 11, 31)
              const end = now.getFullYear() === year ? now : yearEnd
              const days = Math.floor((end.getTime() - yearStart.getTime()) / 86400000) + 1
              return (
                <button
                  class={`streak-tab${i === 0 ? " active" : ""}`}
                  data-year={String(year)}
                  data-label={`${count} workout${count !== 1 ? "s" : ""} in ${days} days in ${year}`}
                >
                  {year}
                </button>
              )
            })}
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

  WorkoutStreak.css = `
    .workout-streak {
      margin: 1.5rem 0 2rem;
    }
    .workout-streak .streak-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.6rem;
    }
    .workout-streak .streak-label {
      font-size: 0.85rem;
      color: var(--gray);
    }
    .workout-streak .streak-year-tabs {
      display: flex;
      gap: 0.4rem;
    }
    .workout-streak .streak-tab {
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
    .workout-streak .streak-tab.active {
      background: var(--secondary);
      color: var(--light);
      border-color: var(--secondary);
    }
    .workout-streak .streak-tab:hover:not(.active) {
      border-color: var(--gray);
      color: var(--darkgray);
    }
    .workout-streak .streak-grid {
      display: none;
    }
    .workout-streak .streak-grid.active {
      display: block;
    }
    .workout-grid-container {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .workout-month-row {
      display: grid;
      gap: 3px;
      font-size: 0.7rem;
      color: var(--gray);
    }
    .workout-month-label {
      text-align: left;
      overflow: hidden;
    }
    .workout-grid-inner {
      display: flex;
      gap: 4px;
    }
    .workout-day-labels {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex-shrink: 0;
      width: 24px;
    }
    .workout-day-label {
      font-size: 0.6rem;
      color: var(--gray);
      display: flex;
      align-items: center;
      flex: 1;
      line-height: 1;
    }
    .workout-weeks {
      display: grid;
      gap: 3px;
      flex: 1;
      min-width: 0;
    }
    .workout-week {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .workout-day {
      aspect-ratio: 1;
      width: 100%;
      border-radius: 2px;
      background: var(--lightgray);
    }
    .workout-day.today {
      outline: 2px solid var(--darkgray);
      outline-offset: -1px;
      border-radius: 2px;
    }
    @media (max-width: 800px) {
      .workout-streak .streak-header {
        flex-wrap: wrap;
        gap: 0.4rem;
      }
    }
    .workout-day.active {
      background: #26a641;
    }
    [saved-theme="light"] .workout-day.active {
      background: #40c463;
    }

    /* Hide page-listing and hr on workouts page */
    body[data-slug="workouts/index"] .page-listing {
      display: none;
    }
    body[data-slug="workouts/index"] .center > hr {
      display: none;
    }
  `

  WorkoutStreak.afterDOMLoaded = `
    document.querySelectorAll(".workout-streak .streak-tab").forEach(function(tab) {
      tab.addEventListener("click", function() {
        var year = tab.getAttribute("data-year");
        var container = tab.closest(".workout-streak");
        container.querySelectorAll(".streak-tab").forEach(function(t) { t.classList.remove("active"); });
        container.querySelectorAll(".streak-grid").forEach(function(g) { g.classList.remove("active"); });
        tab.classList.add("active");
        var grid = container.querySelector('.streak-grid[data-year="' + year + '"]');
        if (grid) grid.classList.add("active");
        var label = tab.getAttribute("data-label");
        if (label) container.querySelector(".streak-label").textContent = label;
      });
    });
  `

  return WorkoutStreak
}) satisfies QuartzComponentConstructor
