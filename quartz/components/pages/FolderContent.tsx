import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

import style from "../styles/listPage.scss"
import { PageList, SortFn } from "../PageList"
import { Root } from "hast"
import { htmlToJsx } from "../../util/jsx"
import { i18n } from "../../i18n"
import { QuartzPluginData } from "../../plugins/vfile"
import { ComponentChildren } from "preact"
import { concatenateResources } from "../../util/resources"
import { trieFromAllFiles } from "../../util/ctx"

interface FolderContentOptions {
  /**
   * Whether to display number of folders
   */
  showFolderCount: boolean
  showSubfolders: boolean
  sort?: SortFn
}

const defaultOptions: FolderContentOptions = {
  showFolderCount: true,
  showSubfolders: true,
}

export default ((opts?: Partial<FolderContentOptions>) => {
  const options: FolderContentOptions = { ...defaultOptions, ...opts }

  const FolderContent: QuartzComponent = (props: QuartzComponentProps) => {
    const { tree, fileData, allFiles, cfg } = props

    const trie = (props.ctx.trie ??= trieFromAllFiles(allFiles))
    const folder = trie.findNode(fileData.slug!.split("/"))
    if (!folder) {
      return null
    }

    const allPagesInFolder: QuartzPluginData[] =
      folder.children
        .map((node) => {
          // regular file, proceed
          if (node.data) {
            return node.data
          }

          if (node.isFolder && options.showSubfolders) {
            // folders that dont have data need synthetic files
            const getMostRecentDates = (): QuartzPluginData["dates"] => {
              let maybeDates: QuartzPluginData["dates"] | undefined = undefined
              for (const child of node.children) {
                if (child.data?.dates) {
                  // compare all dates and assign to maybeDates if its more recent or its not set
                  if (!maybeDates) {
                    maybeDates = { ...child.data.dates }
                  } else {
                    if (child.data.dates.created > maybeDates.created) {
                      maybeDates.created = child.data.dates.created
                    }

                    if (child.data.dates.modified > maybeDates.modified) {
                      maybeDates.modified = child.data.dates.modified
                    }

                    if (child.data.dates.published > maybeDates.published) {
                      maybeDates.published = child.data.dates.published
                    }
                  }
                }
              }
              return (
                maybeDates ?? {
                  created: new Date(),
                  modified: new Date(),
                  published: new Date(),
                }
              )
            }

            return {
              slug: node.slug,
              dates: getMostRecentDates(),
              frontmatter: {
                title: node.displayName,
                tags: [],
              },
            }
          }
        })
        .filter((page) => page !== undefined) ?? []
    const cssClasses: string[] = fileData.frontmatter?.cssclasses ?? []
    const classes = cssClasses.join(" ")

    const content = (
      (tree as Root).children.length === 0
        ? fileData.description
        : htmlToJsx(fileData.filePath!, tree)
    ) as ComponentChildren

    const slug = fileData.slug ?? ""
    const isWritingFolder = slug === "w" || slug.startsWith("w/")

    const listProps = {
      ...props,
      sort: options.sort,
      allFiles: allPagesInFolder,
      writingFolder: isWritingFolder,
    }
    const writingTags = isWritingFolder
      ? [...new Set(allPagesInFolder.flatMap((p) => p.frontmatter?.tags ?? []))].sort()
      : []

    return (
      <div class={`popover-hint${isWritingFolder ? " writing-folder" : ""}`}>
        <article class={classes}>{content}</article>
        {isWritingFolder && writingTags.length > 0 && (
          <div class="writing-filters">
            <div class="writing-filter-group">
              <button class="writing-filter-btn active" data-filter="all">
                All
              </button>
              {writingTags.map((tag) => (
                <button class="writing-filter-btn" data-filter={tag}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
        <div class="page-listing">
          {options.showFolderCount && (
            <p>
              {i18n(cfg.locale).pages.folderContent.itemsUnderFolder({
                count: allPagesInFolder.length,
              })}
            </p>
          )}
          <div>
            <PageList {...listProps} />
          </div>
        </div>
      </div>
    )
  }

  const writingFilterCss = `
    .writing-filters {
      margin-bottom: 1.5rem;
    }
    .writing-filter-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .writing-filter-btn {
      background: transparent;
      border: 1px solid var(--lightgray);
      border-radius: 2rem;
      padding: 0.3rem 0.75rem;
      font-size: 0.8rem;
      color: var(--darkgray);
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
      text-transform: capitalize;
    }
    .writing-filter-btn:hover {
      border-color: var(--secondary);
      color: var(--secondary);
    }
    .writing-filter-btn.active {
      background: var(--secondary);
      border-color: var(--secondary);
      color: var(--light);
    }
  `
  FolderContent.css = concatenateResources(style, PageList.css, writingFilterCss)

  FolderContent.afterDOMLoaded = `
    document.addEventListener("nav", () => {
      const filterContainer = document.querySelector(".writing-filters")
      if (!filterContainer) return

      const items = document.querySelectorAll(".section-li")
      const activeFilters = new Set()

      function applyFilters() {
        const allBtn = filterContainer.querySelector('[data-filter="all"]')
        if (activeFilters.size === 0) {
          allBtn.classList.add("active")
          items.forEach(item => { item.style.display = "" })
        } else {
          allBtn.classList.remove("active")
          items.forEach(item => {
            const tags = (item.dataset.tags || "").split(",").filter(Boolean)
            const matches = [...activeFilters].some(f => tags.includes(f))
            item.style.display = matches ? "" : "none"
          })
        }
      }

      filterContainer.querySelectorAll(".writing-filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const filter = btn.dataset.filter
          if (filter === "all") {
            activeFilters.clear()
            filterContainer.querySelectorAll(".writing-filter-btn:not([data-filter='all'])").forEach(b => b.classList.remove("active"))
          } else {
            if (activeFilters.has(filter)) {
              activeFilters.delete(filter)
              btn.classList.remove("active")
            } else {
              activeFilters.add(filter)
              btn.classList.add("active")
            }
          }
          applyFilters()
        })
      })
    })
  `

  return FolderContent
}) satisfies QuartzComponentConstructor
