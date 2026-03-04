import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

interface Options {
  compact?: boolean
}

export default ((opts?: Options) => {
  const compact = opts?.compact ?? false

  const SubstackEmbed: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    const wrapperClass = compact ? "substack-embed substack-embed--compact" : "substack-embed"

    return (
      <div class={`${wrapperClass} ${displayClass ?? ""}`}>
        {!compact && <p class="substack-embed__cta">Get new posts in your inbox</p>}
        <iframe
          src="https://www.vikra.cafe/embed"
          width="480"
          height={compact ? "160" : "320"}
          frameBorder="0"
          scrolling="no"
        />
      </div>
    )
  }

  SubstackEmbed.css = `
    .substack-embed {
      margin-top: 3rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .substack-embed__cta {
      font-family: "Schibsted Grotesk", sans-serif;
      font-size: 1.1rem;
      color: var(--darkgray);
      margin: 0 0 0.75rem 0;
      opacity: 0.85;
    }

    .substack-embed iframe {
      border: none;
      background: transparent;
      max-width: 100%;
      border-radius: 8px;
    }

    .substack-embed--compact {
      margin-top: 1.5rem;
      margin-bottom: -2rem;
    }

    .substack-embed--compact iframe {
      max-width: 100%;
    }
  `

  return SubstackEmbed
}) satisfies QuartzComponentConstructor
