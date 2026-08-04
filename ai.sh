#!/bin/sh
PROMPT_TEXT="$1"

specified as @./path/file.txt
if echo "$PROMPT_TEXT" | grep -q "@"; then
  FILE_PATH=$(echo "$PROMPT_TEXT" | grep -o '@[^ ]*' | sed 's/@//')
  if [ -f "$FILE_PATH" ]; then
    FILE_CONTENT=$(cat "$FILE_PATH")
    PROMPT_TEXT=$(echo "$PROMPT_TEXT" | sed "s|@$FILE_PATH|$FILE_CONTENT|g")
  fi
fi
curl -s http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5-coder-3b",
    "messages": [
      {"role": "system", "content": "You are an expert game developer assisting with Project Verdika. Adhere to zero-dependency JavaScript, HTML5 Canvas, and modular clean code standards."},
      {"role": "user", "content": "'"$PROMPT_TEXT"'"}
    ],
    "temperature": 0.2
  }' | jq -r '.choices[0].message.content // .'
