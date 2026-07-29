#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PANDOC_BIN=${PANDOC:-pandoc}
CHAPTERS_FILE="$ROOT_DIR/epub/chapters.txt"
METADATA_FILE="$ROOT_DIR/epub/metadata.yaml"
STYLESHEET="$ROOT_DIR/epub/epub.css"
COVER_IMAGE="$ROOT_DIR/epub/cover.svg"
OUTPUT_FILE=${OUTPUT_FILE:-dist/knowledge-atlas.epub}

case "$OUTPUT_FILE" in
  /*) ;;
  *) OUTPUT_FILE="$ROOT_DIR/$OUTPUT_FILE" ;;
esac

if ! PANDOC_BIN=$(command -v "$PANDOC_BIN"); then
  echo "Pandoc is not installed or is not available in PATH." >&2
  echo "Install Pandoc, then run this script again." >&2
  exit 1
fi

for required_file in \
  "$CHAPTERS_FILE" \
  "$METADATA_FILE" \
  "$STYLESHEET" \
  "$COVER_IMAGE"
do
  if [ ! -f "$required_file" ]; then
    echo "Missing build file: $required_file" >&2
    exit 1
  fi
done

set --
while IFS= read -r chapter; do
  case "$chapter" in
    ""|\#*) continue ;;
  esac

  if [ ! -f "$ROOT_DIR/$chapter" ]; then
    echo "Missing chapter: $chapter" >&2
    exit 1
  fi

  set -- "$@" "$ROOT_DIR/$chapter"
done < "$CHAPTERS_FILE"

if [ "$#" -eq 0 ]; then
  echo "No chapters found in: $CHAPTERS_FILE" >&2
  exit 1
fi

OUTPUT_DIR=$(dirname -- "$OUTPUT_FILE")
TEMP_FILE="$OUTPUT_FILE.tmp.$$"
mkdir -p "$OUTPUT_DIR"
trap 'rm -f "$TEMP_FILE"' EXIT HUP INT TERM

"$PANDOC_BIN" "$@" \
  --from="markdown+smart+pipe_tables+fenced_code_blocks" \
  --to=epub3 \
  --standalone \
  --metadata-file="$METADATA_FILE" \
  --css="$STYLESHEET" \
  --epub-cover-image="$COVER_IMAGE" \
  --toc \
  --toc-depth=2 \
  --epub-chapter-level=1 \
  --resource-path="$ROOT_DIR" \
  --output="$TEMP_FILE"

if command -v unzip >/dev/null 2>&1; then
  unzip -tqq "$TEMP_FILE"
fi

if command -v epubcheck >/dev/null 2>&1; then
  epubcheck "$TEMP_FILE"
fi

mv -f "$TEMP_FILE" "$OUTPUT_FILE"
trap - EXIT HUP INT TERM

echo "Built with $("$PANDOC_BIN" --version | sed -n '1p'):"
echo "$OUTPUT_FILE"
