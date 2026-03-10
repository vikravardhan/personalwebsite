import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { resolveRelative, SimpleSlug } from "../util/path"

export default (() => {
  const NavLinks: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
    const links: { text: string; slug: SimpleSlug }[] = [
      { text: "About", slug: "about" as SimpleSlug },
      { text: "Projects", slug: "projects" as SimpleSlug },
      { text: "Writing", slug: "writing" as SimpleSlug },
      { text: "Workouts", slug: "workouts" as SimpleSlug },
      { text: "Recommendations", slug: "recommendations" as SimpleSlug },
      { text: "Music", slug: "music" as SimpleSlug },
      { text: "Now", slug: "now" as SimpleSlug },
    ]

    return (
      <nav class={classNames(displayClass, "nav-links")}>
        <ul>
          {links.map(({ text, slug }) => (
            <li>
              <a href={resolveRelative(fileData.slug!, slug)}>{text}</a>
            </li>
          ))}
        </ul>
      </nav>
    )
  }

  NavLinks.css = `
    .nav-links {
      margin-top: 0.5rem;
    }
    .nav-links ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .nav-links li {
      margin: 0.35rem 0;
    }
    .nav-links a {
      font-size: 0.95rem;
      text-decoration: none;
      color: var(--darkgray);
      opacity: 0.85;
      transition: color 0.15s ease, opacity 0.15s ease;
    }
    .nav-links a:hover {
      opacity: 1;
      color: var(--secondary);
    }
    @media (max-width: 800px) {
      .nav-links {
        margin-top: 0;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .nav-links ul {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem 0.75rem;
      }
      .nav-links li {
        margin: 0;
      }
      .nav-links a {
        font-size: 0.85rem;
        white-space: nowrap;
      }
    }
  `

  return NavLinks
}) satisfies QuartzComponentConstructor
