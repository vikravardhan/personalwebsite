import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { loadWorkoutData } from "./WorkoutStreak"

export default (() => {
  const WorkoutLog: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    const workouts = loadWorkoutData()

    const recentWorkouts = [...workouts]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 25)

    if (recentWorkouts.length === 0) return null

    const formatDuration = (mins: number) => {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return h > 0 ? `${h}h ${m}m` : `${m}m`
    }

    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr + "T00:00:00")
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }

    return (
      <div class={classNames(displayClass, "workout-log")}>
        <h3>Recent Workouts</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Activity</th>
              <th>Strain</th>
              <th>Duration</th>
              <th>Calories</th>
            </tr>
          </thead>
          <tbody>
            {recentWorkouts.map((w) => (
              <tr>
                <td>{formatDate(w.date)}</td>
                <td>{w.sport}</td>
                <td>{w.strain.toFixed(1)}</td>
                <td>{formatDuration(w.duration_mins)}</td>
                <td>{w.calories}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div class="workout-note">
          <p>
            Every session is a vote for the person I'm becoming. Some days it's a heavy lift, other
            days it's just showing up for a stretch — but the streak doesn't care about intensity, only
            consistency. This log is my proof of work.
          </p>
        </div>
      </div>
    )
  }

  WorkoutLog.css = `
    .workout-log {
      margin-top: 1rem;
    }
    .workout-log h3 {
      font-size: 1rem;
      margin: 0 0 0.75rem;
      color: var(--darkgray);
    }
    .workout-log table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .workout-log thead th {
      text-align: left;
      padding: 0.5rem 0.75rem;
      border-bottom: 2px solid var(--lightgray);
      color: var(--gray);
      font-weight: 600;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .workout-log tbody tr {
      border-bottom: 1px solid var(--lightgray);
      transition: background 0.1s ease;
    }
    .workout-log tbody tr:hover {
      background: var(--highlight);
    }
    .workout-log tbody td {
      padding: 0.5rem 0.75rem;
      color: var(--darkgray);
    }
    .workout-log tbody td:nth-child(3) {
      font-weight: 600;
      color: #26a641;
    }
    [saved-theme="light"] .workout-log tbody td:nth-child(3) {
      color: #1a7f37;
    }
    .workout-note {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--lightgray);
    }
    .workout-note p {
      font-size: 0.9rem;
      color: var(--gray);
      line-height: 1.6;
      font-style: italic;
      margin: 0;
    }
  `

  return WorkoutLog
}) satisfies QuartzComponentConstructor
