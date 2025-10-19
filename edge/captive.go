package main

import (
    "html/template"
    "net/http"
)

var captiveTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Roam WiFi</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 400px;
            width: 90%;
        }
        h1 { margin-top: 0; color: #333; }
        input {
            width: 100%;
            padding: 12px;
            margin: 10px 0;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            box-sizing: border-box;
        }
        button {
            width: 100%;
            padding: 14px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 10px;
        }
        button:hover { background: #5568d3; }
        .message { 
            padding: 12px;
            margin: 10px 0;
            border-radius: 8px;
            display: none;
        }
        .error { background: #fee; color: #c33; }
        .success { background: #efe; color: #3c3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>ðŸš€ Roam WiFi</h1>
        <p>Enter your session token from the Roam app to connect:</p>
        
        <input type="text" id="token" placeholder="Session Token" autofocus>
        <button onclick="authenticate()">Connect to Internet</button>
        
        <div id="message" class="message"></div>
        
        <p style="font-size: 12px; color: #999; margin-top: 20px;">
            Don't have a token? Open the Roam app and purchase WiFi access.
        </p>
    </div>

    <script>
    async function authenticate() {
        const token = document.getElementById('token').value.trim();
        const messageEl = document.getElementById('message');
        
        if (!token) {
            showMessage('Please enter a session token', 'error');
            return;
        }
        
        try {
            const response = await fetch('/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_token: token })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showMessage('âœ“ Connected! You now have internet access.', 'success');
                SetTimeout(() => {
                    window.close();
                }, 2000);
            } else {
                showMessage('Invalid or expired token. Please try again.', 'error');
            }
        } catch (error) {
            showMessage('Connection error. Please try again.', 'error');
        }
    }
    
    function showMessage(text, type) {
        const el = document.getElementById('message');
        el.textContent = text;
        el.className = 'message ' + type;
        el.style.display = 'block';
    }
    
    document.getElementById('token').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') authenticate();
    });
    </script>
</body>
</html>
`

func handleCaptivePortal(w http.ResponseWriter, r *http.Request) {
    clientIP := getClientIP(r)
    clientMAC := getMACFromIP(clientIP)
    
    // Check if already authenticated
    ipt := NewIPTablesManager()
    if ipt.IsAuthenticated(clientMAC) {
        http.Redirect(w, r, "https://google.com", http.StatusFound)
        return
    }
    
    w.Header().Set("Content-Type", "text/html; charset=utf-8")
    tmpl := template.Must(template.New("captive").Parse(captiveTemplate))
    tmpl.Execute(w, nil)
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.Write([]byte(`{"status":"online","service":"roam-edge"}`))
}
