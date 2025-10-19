#!/usr/bin/env bash
# WHY: We keep .gguf out of Git; this hints/downloads models into models/
set -euo pipefail
MODELS_DIR="${1:-models}"
MODEL_NAME="${2:-qwen2.5-1.5b-instruct-q4_k_m.gguf}"

mkdir -p "$MODELS_DIR"
echo "Place or download GGUF to: $MODELS_DIR/$MODEL_NAME"
echo "Example:"
echo "  curl -L 'https://<direct-url-to-your-gguf>' -o '$MODELS_DIR/$MODEL_NAME'"
