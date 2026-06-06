# Dev Access — previewing components over SSH

How to view in-progress design-system components in your local browser, without
babysitting the dev server or the tunnel.

## Mental model: one component, one port

Each in-progress component is hosted on its **own port** by a managed dev server.
When a component ships, its port is recycled for the next one. Building three
components at once just means three ports at once. Every port serves the whole
Vite app, but the port's preview lands directly on its assigned component (via
`VITE_PREVIEW_ROUTE`), so `http://localhost:<port>/` shows that component.

The dev servers are **systemd user services** (`deha-preview@<port>`). They
auto-restart on crash and start on boot (user-linger is enabled), so the
"server died after a few hours / after a reboot" problem is gone. You never
start them by hand.

## Daily use: the `dehaprev` helper

Run on the VPS (`bora@178.104.8.163`), from the repo:

```bash
scripts/dehaprev start leads-table      # start (or reuse) the port for a component
scripts/dehaprev start cards 5174       # second component on its own port
scripts/dehaprev list                   # all active previews: port, component, route, status
scripts/dehaprev tunnel                 # ONE ssh command forwarding every active port
scripts/dehaprev stop leads-table       # stop a component's preview
scripts/dehaprev restart cards          # restart
```

`start` prints the URL and the exact ssh command for that port. The component to
port to route mapping lives in `apps/web/preview-ports.json`; per-port focus is
written to `~/.config/deha-preview/<port>.env` as `VITE_PREVIEW_ROUTE=<route>`.

## The tunnel (your local machine)

Open one tunnel per session. `scripts/dehaprev tunnel` prints a single command
forwarding all active ports, for example:

```bash
ssh -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
    -L 5173:localhost:5173 -L 5174:localhost:5174 bora@178.104.8.163
```

Then open `http://localhost:5173/`, `http://localhost:5174/`, etc.

### Make reconnects painless (recommended one-time setup)

Add this to your LOCAL `~/.ssh/config` so dropped tunnels self-heal and you can
type `ssh -L 5173:localhost:5173 deha`:

```
Host deha
  HostName 178.104.8.163
  User bora
  ServerAliveInterval 30
  ServerAliveCountMax 3
  ExitOnForwardFailure yes
```

`ServerAliveInterval`/`ServerAliveCountMax` keep the connection probed and drop
it cleanly if the network dies, so your terminal returns instead of hanging.
Re-run the ssh command to reconnect (the dev servers keep running regardless).

## What you do NOT need to do

- **Re-run ssh per code change:** no. Vite HMR pushes edits live over the open
  tunnel. Keep the tunnel open; changes appear instantly.
- **Re-run ssh per component or per new component:** no for components sharing a
  port session; a new port just adds one more `-L` (use `dehaprev tunnel` to get
  the combined command). The server side is already running.
- **Restart the server after a crash or reboot:** no. systemd does it.

## Failure modes and fixes

| Symptom | Cause | Fix |
|---|---|---|
| Browser can't connect after a while | SSH tunnel dropped | Re-run the ssh command (keepalive config makes this rare) |
| Port shows nothing right after `start` | Vite cold start | Wait a few seconds; `dehaprev list` shows reachability |
| `strictPort` error on start | Something else holds the port | Stop the stray process, or pick another port |

## Not changed by this setup

- **`sshd_config` is NOT modified.** A VPS-side `ClientAliveInterval` is an
  optional manual hardening, but changing `sshd_config` + restarting sshd carries
  a lockout risk, so it is left to you to do deliberately if ever wanted.
- **zrok** stays for sharing a preview publicly with colleagues only, not for
  your own dev review.

## Future option: Tailscale

If you later want zero per-session ssh (open `http://deha-devops-1:5173` from any
device, including a phone), install Tailscale on the VPS and your devices, run
vite with `--host` (already set), and add the Tailscale hostname to
`server.allowedHosts`. Not set up today.
