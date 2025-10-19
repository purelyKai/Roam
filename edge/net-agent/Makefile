# WHY: Developer shortcuts so you type less.
SHELL := /bin/bash
ROOT := $(shell pwd)
MODEL ?= qwen2.5-1.5b-instruct-q4_k_m.gguf
MODEL_URL ?= https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf

.PHONY: llama build-agent run-llama run-agent model bootstrap-pi test clean

llama:               # build llama.cpp server into bin/
	./scripts/build-llama.sh

build-agent:         # compile your Go agent
	mkdir -p bin
	go build -o bin/agent ./cmd/agent

run-llama:           # run llama locally for dev
	@if [ ! -f "bin/llama-server" ]; then echo "Run 'make llama' first"; exit 1; fi
	@if [ ! -f "models/$(MODEL)" ]; then echo "Run 'make model' first"; exit 1; fi
	bin/llama-server -m models/$(MODEL) \
		-c $${LLAMA_CTX:-512} \
		-t $${LLAMA_THREADS:-4} \
		-b $${LLAMA_BATCH:-512} \
		--host 127.0.0.1 \
		--port $${LLAMA_PORT:-8080} \
		--n-gpu-layers 99 \
		--flash-attn auto

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
	@bin/llama-server -m models/$(MODEL) -c 512 -t 4 -b 512 --host 127.0.0.1 --port 8080 --n-gpu-layers 99 --flash-attn auto> /tmp/llama.log 2>&1 &
	@echo "==> Waiting for llama to load model (this takes ~10-15 seconds)..."
	@for i in {1..30}; do \
		sleep 1; \
		if curl -s http://127.0.0.1:8080/health > /dev/null 2>&1; then \
			echo ""; \
			echo "==> Llama is healthy!"; \
			pkill -f llama-server; \
			echo "==> Test complete ✓"; \
			exit 0; \
		fi; \
		echo -n "."; \
	done; \
	echo ""; \
	echo "==> Llama failed to start. Check /tmp/llama.log for details:"; \
	tail -20 /tmp/llama.log; \
	pkill -f llama-server; \
	exit 1

clean:               # remove built artifacts
	rm -rf bin/ build/
