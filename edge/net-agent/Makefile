# WHY: Developer shortcuts so you type less.
SHELL := /bin/bash
MODEL ?= qwen2.5-1.5b-instruct-q4_k_m.gguf

.PHONY: llama build-agent run-llama run-agent model bootstrap-pi

llama:               # build llama.cpp server into bin/
	./scripts/build-llama.sh

build-agent:         # compile your Go agent
	go build -o bin/agent ./cmd/agent

run-llama:           # run llama locally for dev
	bin/llama-server -m models/$(MODEL) -c $${LLAMA_CTX:-2048} -t $${LLAMA_THREADS:-$(shell nproc)} --host 127.0.0.1 --port $${LLAMA_PORT:-8080} --kv-type $${LLAMA_KV_TYPE:-q8_0}

run-agent:           # run agent locally for dev
	LLAMA_URL=http://127.0.0.1:$${LLAMA_PORT:-8080} ./bin/agent

model:               # hint for pulling models
	./scripts/get-model.sh models $(MODEL)

bootstrap-pi:        # one-shot Pi setup
	./scripts/bootstrap-pi.sh
