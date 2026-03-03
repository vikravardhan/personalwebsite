import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

export default (() => {
  const NavLinks: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    const links = [
      { text: "About", href: "/about" },
      { text: "Projects", href: "/projects" },
      { text: "Writing", href: "/writing" },
      { text: "Now", href: "/now" },
    ]

    return (
      <nav class={classNames(displayClass, "nav-links")}>
        <ul>
          {links.map(({ text, href }) => (
            <li>
              <a href={href}>{text}</a>
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
  `

  return NavLinks
}) satisfies QuartzComponentConstructor
