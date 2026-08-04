#!/bin/bash
# =========================================================================
# STRUCTURE: Autonomous Local AI Developer Pipeline
# =========================================================================

PROMPT_TEXT="$1"

# Extract file context if @ template exists
if [[ "$PROMPT_TEXT" == *"@"* ]]; then
  RAW_PATH=$(echo "$PROMPT_TEXT" | grep -o '@[^ ]*' | sed 's/@//' | sed 's/[,;:]*$//')
  
  if [ -f "$RAW_PATH" ]; then
    FILE_CONTENT=$(cat "$RAW_PATH")
    CLEAN_PROMPT="${PROMPT_TEXT//@$RAW_PATH/}"
    
    PROMPT_TEXT="$CLEAN_PROMPT

Template Specs ($RAW_PATH):
$FILE_CONTENT"
  fi
fi

# Pass full context into Python agent
python3 agent.py "$PROMPT_TEXT"
