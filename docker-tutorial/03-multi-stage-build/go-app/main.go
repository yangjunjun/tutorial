package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

// Response 定义通用响应结构
type Response struct {
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
	Hostname  string `json:"hostname"`
}

func main() {
	http.HandleFunc("/", handleRoot)
	http.HandleFunc("/health", handleHealth)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("服务器启动，监听端口 :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func handleRoot(w http.ResponseWriter, r *http.Request) {
	hostname, _ := os.Hostname()

	resp := Response{
		Message:   "Hello, Docker 多阶段构建!",
		Timestamp: time.Now().Format(time.RFC3339),
		Hostname:  hostname,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)

	fmt.Printf("[%s] %s %s\n", time.Now().Format("2006-01-02 15:04:05"), r.Method, r.URL.Path)
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
		"time":   time.Now().Format(time.RFC3339),
	})
}
