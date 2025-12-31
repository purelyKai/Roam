# Roam Edge Dashboard

A real-time monitoring dashboard for the Roam Edge service running on Raspberry Pi. This web application displays connected devices and streams live system logs.

This dashboard is hosted at [roam-eta.vercel.app](https://roam-eta.vercel.app/) and will display the logs only for the edge device in which the user of the dashboard shares the same network.

## Features

- 📱 **Device Monitoring**: View all connected devices with their status, MAC addresses, connection time, and remaining session time
- 📊 **Live Log Streaming**: Real-time streaming of system logs from the edge service using Server-Sent Events (SSE)
- 🔄 **Auto-refresh**: Device list updates every 5 seconds
- 🎨 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Modern Tech Stack**: Built with React, TypeScript, Vite, and Tailwind CSS

## Prerequisites

- Node.js 18+ and npm
- Running Roam Edge service on Raspberry Pi (with API server enabled)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API URL

Create a `.env` file from the example:

```bash
cp .env.example .env
```

### 3. Run Development Server

```bash
npm run dev
```

The dashboard will be available at `http://your_pi_ip:5173`

### 4. Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deployment to Vercel

### Option 1: Vercel CLI

1. Install Vercel CLI:

```bash
npm install -g vercel
```

2. Deploy:

```bash
vercel
```

3. Set environment variable in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `VITE_API_URL` with your Pi's URL

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Import the repository in Vercel
3. Set the root directory to `web`
4. Add environment variable `VITE_API_URL`
5. Deploy

## Raspberry Pi Setup

### 1. Enable API Server

Make sure your edge service is running with the API server enabled. The service should have these endpoints:

- `GET /api/devices` - Returns list of connected devices
- `GET /api/logs/stream` - SSE endpoint for log streaming
- `GET /health` - Health check endpoint

### 2. Configure Port

The edge service API runs on port 8080 by default. You can change this in the edge service's `.env` file:

```env
API_PORT=8080
```

### 3. Network Access

#### For Local Network Access:

- Find your Pi's local IP: `hostname -I`
- Use this IP in your dashboard's `.env`: `VITE_API_URL=http://192.168.1.100:8080`

#### For Public Internet Access (Vercel deployment):

You need to expose your Pi to the internet. Options:

1. **Port Forwarding**: Configure your router to forward port 8080 to your Pi
2. **Cloudflare Tunnel**: Use Cloudflare Tunnel (recommended for security)
3. **Tailscale**: Use Tailscale for secure remote access
4. **ngrok**: Use ngrok for temporary public URLs

### 4. CORS Configuration

The edge service API already includes CORS headers to allow requests from any origin. This is configured in `edge/api.go`.

## API Endpoints

### GET /api/devices

Returns list of connected devices:

```json
{
  "devices": [
    {
      "mac": "aa:bb:cc:dd:ee:ff",
      "status": "active",
      "granted_at": "2025-10-19T10:30:00Z",
      "expires_at": "2025-10-19T11:00:00Z",
      "duration_minutes": 30,
      "time_left_minutes": 25,
      "signal_info": "-45 dBm"
    }
  ],
  "count": 1
}
```

### GET /api/logs/stream

Server-Sent Events stream of logs:

```
data: {"type":"log","message":"📱 New device connected: aa:bb:cc:dd:ee:ff","timestamp":"2025-10-19T10:30:00Z"}

data: {"type":"log","message":"✅ Granted internet to aa:bb:cc:dd:ee:ff for 30 minutes","timestamp":"2025-10-19T10:30:01Z"}
```

## Troubleshooting

### Dashboard can't connect to API

1. Check if edge service is running: `sudo systemctl status edge`
2. Verify API port is open: `curl http://localhost:8080/health`
3. Check firewall rules on Pi: `sudo ufw status`
4. Verify CORS is working in browser console

### Logs not streaming

1. Ensure journalctl has logs: `sudo journalctl -u edge -n 50`
2. Check if SSE endpoint is accessible: `curl http://localhost:8080/api/logs/stream`
3. Verify user has permission to run journalctl with sudo

### Device list not updating

1. Check if devices endpoint returns data: `curl http://localhost:8080/api/devices`
2. Look for errors in browser console (F12)
3. Verify edge service is monitoring devices

## Development

### Project Structure

```
web/
├── src/
│   ├── components/
│   │   ├── DeviceList.tsx    # Device monitoring component
│   │   └── LogStream.tsx     # Log streaming component
│   ├── types.ts              # TypeScript type definitions
│   ├── App.tsx               # Main app component
│   ├── index.css             # Global styles with Tailwind
│   └── main.tsx              # App entry point
├── public/                   # Static assets
├── .env.example             # Environment variables template
├── tailwind.config.js       # Tailwind configuration
├── vite.config.ts           # Vite configuration
└── package.json             # Dependencies and scripts
```

### Tech Stack

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Server-Sent Events**: Real-time log streaming

## License

Part of the Roam project.
