package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Messages      []ChatMessage `json:"messages"`
	MaxTokens     int           `json:"max_tokens"`
	Temperature   float64       `json:"temperature"`
	Stream        bool          `json:"stream"`
	TopK          int           `json:"top_k,omitempty"`
	TopP          float64       `json:"top_p,omitempty"`
	RepeatPenalty float64       `json:"repeat_penalty,omitempty"`
	Stop          []string      `json:"stop,omitempty"`
	AddGenPrompt  bool          `json:"add_generation_prompt,omitempty"`
}

type ChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
}

const systemPrompt = `You are a network security assistant running on a Raspberry Pi edge device.

Your capabilities:
1. Block traffic to/from specific domains or IPs
2. Disconnect devices from the network
3. Monitor network activity and show device statistics

Respond in 1-2 short sentences. Be direct and actionable.`

func main() {
	llamaURL := os.Getenv("LLAMA_URL")
	if llamaURL == "" {
		llamaURL = "http://127.0.0.1:8080"
	}

	log.Printf("🚀 Network Agent starting... (llama: %s)", llamaURL)
	log.Printf("📡 Monitoring network activity...")

	// Health check on startup
	if err := checkLlama(llamaURL); err != nil {
		log.Fatalf("Failed to connect to llama: %v", err)
	}
	log.Println("✓ Llama is ready")

	// Periodic health checks
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	// Simulate some network events for testing
	testCommands := []string{
		"Block traffic from facebook.com",
		"Show me the top 3 devices by bandwidth usage",
		"Kick device 192.168.1.100 off the network",
	}

	// Test each command
	for i, cmd := range testCommands {
		time.Sleep(2 * time.Second)
		log.Printf("\n[Test %d] User command: %s", i+1, cmd)
		response, err := askLlama(llamaURL, cmd)
		if err != nil {
			log.Printf("❌ Error: %v", err)
		} else {
			log.Printf("🤖 Agent: %s", response)
		}
	}

	// Keep running for health checks
	for {
		select {
		case <-ticker.C:
			if err := checkLlama(llamaURL); err != nil {
				log.Printf("⚠️  Health check failed: %v", err)
			} else {
				log.Println("✓ System healthy")
			}
		}
	}
}

func askLlama(baseURL, userPrompt string) (string, error) {
	req := ChatRequest{
		Messages: []ChatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
		MaxTokens:     128,
		Temperature:   0.2, // lower temp to avoid degenerate loops
		TopK:          40,
		TopP:          0.9,
		RepeatPenalty: 1.1,
		Stop:          []string{"<|im_end|>", "<|endoftext|>"},
		AddGenPrompt:  true,
		Stream:        false,
	}

	jsonData, err := json.Marshal(req)
	if err != nil {
		return "", fmt.Errorf("marshal failed: %w", err)
	}
	log.Printf("DEBUG: chat request bytes=%d", len(jsonData))

	resp, err := http.Post(baseURL+"/v1/chat/completions", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("http request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("bad status: %d", resp.StatusCode)
	}

	var result ChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decode failed: %w", err)
	}
	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no choices returned")
	}

	content := strings.TrimSpace(result.choicesText())
	log.Printf("DEBUG: finish_reason=%s, preview=%q",
		result.Choices[0].FinishReason, content[:min(50, len(content))])

	if content == "" {
		return "", fmt.Errorf("empty response from model")
	}
	return content, nil
}

// Small helper so we don't panic on missing message/content in any choice.
func (r ChatResponse) choicesText() string {
	for _, c := range r.Choices {
		if s := strings.TrimSpace(c.Message.Content); s != "" {
			return s
		}
	}
	return ""
}

func checkLlama(baseURL string) error {
	resp, err := http.Get(baseURL + "/health")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("unhealthy status: %d", resp.StatusCode)
	}
	return nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
