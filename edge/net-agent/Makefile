# WHY: Developer shortcuts so you type less.
SHELL := /bin/bash
ROOT := $(shell pwd)
MODEL ?= qwen2.5-1.5b-instruct-q4_k_m.gguf
MODEL_URL ?= https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf

.PHONY: llama build-agent run-llama run-agent model bootstrap-pi test

llama:               # build llama.cpp server into bin/
	./scripts/build-llama.sh

build-agent:         # compile your Go agent
	mkdir -p bin
	go build -o bin/agent ./cmd/agent

run-llama:           # run llama locally for dev
	@if [ ! -f "bin/llama-server" ]; then echo "Run 'make llama' first"; exit 1; fi
	@if [ ! -f "models/$(MODEL)" ]; then echo "Run 'make model' first"; exit 1; fi
	bin/llama-server -m models/$(MODEL) -c $${LLAMA_CTX:-2048} -t $${LLAMA_THREADS:-$$(sysctl -n hw.ncpu 2>/dev/null || nproc)} --host 127.0.0.1 --port $${LLAMA_PORT:-8080} --kv-type $${LLAMA_KV_TYPE:-q8_0}

run-agent:           # run agent locally for dev
	@if [ ! -f "bin/agent" ]; then echo "Run 'make build-agent' first"; exit 1; fi
	LLAMA_URL=http://127.0.0.1:$${LLAMA_PORT:-8080} ./bin/agent

model:               # download model if not present
	@mkdir -p models
	@if [ ! -f "models/$(MODEL)" ]; then \
		echo "Downloading $(MODEL)... (this may take a few minutes)"; \
		curl -L --progress-bar "$(MODEL_URL)" -o "models/$(MODEL)"; \
		echo "✓ Model downloaded to models/$(MODEL)"; \
	else \
		echo "✓ Model already exists: models/$(MODEL)"; \
	fi

bootstrap-pi:        # one-shot Pi setup (Pi only!)
	./scripts/bootstrap-pi.sh

test: llama build-agent model  # test the full flow locally
	@echo "==> Starting llama server..."
	@bin/llama-server -m models/$(MODEL) -c 2048 -t 2 --host 127.0.0.1 --port 8080 &
	@sleep 3
	@echo "==> Testing llama endpoint..."
	@curl -s http://127.0.0.1:8080/health || (echo "Llama not responding"; pkill -f llama-server; exit 1)
	@echo "==> Llama is healthy!"
	@pkill -f llama-server
	@echo "==> Test complete"
