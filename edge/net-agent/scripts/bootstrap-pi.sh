#!/usr/bin/env bash
# WHY: One command to turn a fresh Pi into your router+LLM box using project-local files.
set -euo pipefail
cd "$(dirname "$0")/.."


# 0) Ensure all scripts are executable (added just in case Git doesn't preserve permissions).
chmod +x scripts/*.sh

# 1) OS packages we need: build chain + network daemons.
sudo apt update
sudo apt install -y git build-essential cmake pkg-config \
  hostapd dnsmasq nftables wireguard-tools jq curl

# 2) Build the llama server from our pinned sources.
./scripts/build-llama.sh

# 3) Model presence sanity check; we don't commit models to Git.
if [ ! -f "models/${LLAMA_MODEL:-qwen2.5-1.5b-instruct-q4_k_m.gguf}" ]; then
  echo ">>> No model found in models/. Run: ./scripts/get-model.sh models ${LLAMA_MODEL:-qwen2.5-1.5b-instruct-q4_k_m.gguf}"
fi

# 4) Build the Go agent (the brain that controls nftables/hostapd/tc).
if ! command -v go &> /dev/null; then
  echo "Go not found. Installing Go 1.21.5 for arm64..."
  GO_VERSION="1.21.5"
  GO_TARBALL="go${GO_VERSION}.linux-arm64.tar.gz"

  wget "https://go.dev/dl/${GO_TARBALL}" -O "/tmp/${GO_TARBALL}"
  sudo rm -rf /usr/local/go
  sudo tar -C /usr/local -xzf "/tmp/${GO_TARBALL}"
  rm "/tmp/${GO_TARBALL}"

  export PATH=$PATH:/usr/local/go/bin
  echo 'export PATH=$PATH:/usr/local/go/bin' | sudo tee -a /etc/profile.d/go.sh

  if ! command -v go &> /dev/null; then
      echo "Error: Go installation failed."
      exit 1
  fi

  echo "Go ${GO_VERSION} installed successfully."
fi

# Initialize Go module if not present
if [ ! -f "go.mod" ]; then
  echo "Initializing Go module..."
  go mod init roam/edge/net-agent
fi

mkdir -p bin
if [ ! -f "bin/agent" ]; then
  echo "Building Go agent..."
  go build -o bin/agent ./cmd/agent
  sudo setcap cap_net_admin,cap_net_raw+ep ./bin/agent || true
fi

# 5) Install and start local systemd units that run FROM THIS REPO.
sudo install -m 644 systemd/llama.service /etc/systemd/system/llama.service
sudo install -m 644 systemd/agent.service /etc/systemd/system/agent.service
sudo systemctl daemon-reload
sudo systemctl enable --now llama.service
sudo systemctl enable --now agent.service

echo "Bootstrap complete. llama at http://127.0.0.1:${LLAMA_PORT:-8080}"
