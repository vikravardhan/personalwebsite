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

export default (() => {
  const WorkoutStreak: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    const workouts = loadWorkoutData()

    // Build date set for streak
    const dateSet = new Set<string>()
    workouts.forEach((w) => dateSet.add(w.date))

    const currentYear = new Date().getFullYear()
    const yearsInData = [...new Set(workouts.map((w) => parseInt(w.date.slice(0, 4))))]
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
          const hasWorkout = inYear && dateSet.has(dateStr)
          days.push(
            <div
              class={`workout-day${hasWorkout ? " active" : ""}`}
              title={
                inYear
                  ? `${dateStr}${hasWorkout ? ": Workout" : ""}`
                  : ""
              }
            />,
          )
          current.setDate(current.getDate() + 1)
        }
        weeks.push(<div class="workout-week">{days}</div>)
      }

      return (
        <div class="workout-weeks" style={`grid-template-columns: repeat(${weeks.length}, 1fr)`}>
          {weeks}
        </div>
      )
    }

    return (
      <div class={classNames(displayClass, "workout-streak")}>
        <div class="streak-header">
          <span class="streak-label">
            {workouts.length} workout{workouts.length !== 1 ? "s" : ""}
          </span>
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
    .workout-weeks {
      display: grid;
      gap: 3px;
      width: 100%;
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
      });
    });
  `

  return WorkoutStreak
}) satisfies QuartzComponentConstructor
