#!/usr/bin/env bash

# WHY: Build a project-local llama.cpp server binary that matches the host CPU.
# On Pi it enables ARM NEON; on x86 it uses AVX etc. We copy the binary to bin/
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LLAMA="$ROOT/third_party/llama.cpp"
OUT="$ROOT/build/llama"     # <-- build OUTSIDE the submodule
BIN="$ROOT/bin"
mkdir -p "$OUT" "$BIN"

export LLAMA_NATIVE=1                 # optimize for host CPU (Pi vs x86)
cmake -S "$LLAMA" -B "$OUT" -DGGML_OPENMP=ON   # WHY: enable multithreading
cmake --build "$OUT" -j                         # WHY: parallel build

# WHY: newer llama.cpp uses 'llama-server' not 'server'
if [ -f "$OUT/bin/llama-server" ]; then
  cp "$OUT/bin/llama-server" "$BIN/llama-server"     # WHY: keep binaries under project
elif [ -f "$OUT/bin/server" ]; then
  cp "$OUT/bin/server" "$BIN/llama-server"           # WHY: keep binaries under project
else
  echo "Error: Could not find server binary in $OUT/bin/"
  exit 1
fi

echo "Built -> $BIN/llama-server"