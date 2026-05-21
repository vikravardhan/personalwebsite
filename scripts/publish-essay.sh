#!/bin/bash
# Usage: ./scripts/publish-essay.sh "File Name In Obsidian" "url-slug" "tag1,tag2"

set -e

OBSIDIAN_WRITING="/Users/vikravardhan/Desktop/Obsidian Vault/vik's second brain/vikravardhan-com/writing"
CONTENT_DIR="/Users/vikravardhan/Builds/vikravardhan.com/content/w"
TODAY=$(date +%Y-%m-%d)

FILE_NAME="$1"
SLUG="$2"
TAGS_RAW="$3"

if [[ -z "$FILE_NAME" || -z "$SLUG" || -z "$TAGS_RAW" ]]; then
  echo "Usage: ./scripts/publish-essay.sh \"File Name In Obsidian\" \"url-slug\" \"tag1,tag2\""
  exit 1
fi

SRC="$OBSIDIAN_WRITING/$FILE_NAME.md"
DEST="$CONTENT_DIR/$SLUG.md"

if [[ ! -f "$SRC" ]]; then
  echo "Error: File not found at $SRC"
  exit 1
fi

# Build tags yaml
TAGS_YAML=""
IFS=',' read -ra TAGS <<< "$TAGS_RAW"
for tag in "${TAGS[@]}"; do
  TAGS_YAML+="  - $(echo $tag | xargs)\n"
done

# Get title from filename (strip .md if accidentally included)
TITLE="${FILE_NAME%.md}"

# Prepend frontmatter
FRONTMATTER="---\ntitle: $TITLE\npublished: $TODAY\ntags:\n${TAGS_YAML}---\n\n"

# Check if frontmatter already exists
if head -1 "$SRC" | grep -q "^---"; then
  echo "Frontmatter already exists, copying as-is."
  cp "$SRC" "$DEST"
else
  printf '%s' "$FRONTMATTER" | cat - "$SRC" > "$DEST"
fi

echo "Published: $DEST"

# Copy referenced images from Obsidian vault to content/Attachments
OBSIDIAN_ROOT="/Users/vikravardhan/Desktop/Obsidian Vault/vik's second brain"
ATTACHMENTS_DIR="/Users/vikravardhan/Builds/vikravardhan.com/content/Attachments"
images=$(grep -oP '(?<=!\[\[)[^\]|]+' "$DEST" || true)
copied=0
while IFS= read -r img; do
  [[ -z "$img" ]] && continue
  found=$(find "$OBSIDIAN_ROOT" -name "$img" 2>/dev/null | head -1)
  if [[ -n "$found" ]]; then
    cp "$found" "$ATTACHMENTS_DIR/"
    echo "  Copied image: $img"
    ((copied++)) || true
  else
    echo "  WARNING: image not found in vault: $img"
  fi
done <<< "$images"
[[ $copied -gt 0 ]] && echo "Copied $copied image(s) to Attachments."

# Commit and push
cd /Users/vikravardhan/Builds/vikravardhan.com
git add "$DEST" "$ATTACHMENTS_DIR/"
git commit -m "Add essay: $TITLE"
git pull --rebase
git push

echo "Done. Live at /w/$SLUG"
