# Zawadi Platform Console

Standalone dummy UI for the SaaS control panel.

## Local Docker Preview

```bash
docker build -t zawadi-console:local platform-console
docker run --rm -p 3100:80 zawadi-console:local
```

Open:

```text
http://localhost:3100
```

## Live Deployment

The GitHub workflow builds and publishes:

```text
ghcr.io/amalgamate/zawadi-console:latest
```

The server deploy script runs it as:

```text
http://185.127.16.124:3100
```

Later, point `console.elimucrown.co.ke` to the same server in Nginx Proxy Manager:

```text
Forward host: 185.127.16.124
Forward port: 3100
Scheme: http
```

## Next Phase

- Add secure login for platform owner accounts.
- Replace demo data with a console backend API.
- Connect Docker status, storage metrics, and deploy history.
- Add audited start, stop, restart, backup, and redeploy controls.
