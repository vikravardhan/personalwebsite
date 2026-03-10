import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"

interface Options {
  links: Record<string, string>
  showSubscribe?: boolean
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    const links = opts?.links ?? []
    const showSubscribe = opts?.showSubscribe ?? false

    return (
      <footer class={`${displayClass ?? ""}`}>
        {showSubscribe && (
          <div class="footer-subscribe">
            <hr />
            <p class="footer-subscribe__cta">Get new posts in your inbox</p>
            <div class="footer-subscribe__iframe-clip">
              <iframe
                src="https://www.vikra.cafe/embed"
                width="480"
                height="160"
                style="max-width: 100%;"
                frameBorder="0"
                scrolling="no"
              />
            </div>
          </div>
        )}
        <ul>
          {Object.entries(links).map(([text, link]) => (
            <li>
              <a href={link}>{text}</a>
            </li>
          ))}
        </ul>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
