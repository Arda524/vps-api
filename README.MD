# VPS API

A secure Node.js backend for managing server status, file uploads, process control, storage info, and system logs.

## Features

- Modular route/controller/service architecture
- API key authentication
- Environment-based configuration
- File browsing and preview using secure filesystem operations
- Process and storage endpoints for server monitoring
- Centralized error handling and structured logging

## Requirements

- Node.js 20+ (or compatible latest LTS)
- npm
- A Linux server environment for the system endpoints
- `SERVER_API_KEY` configured for API authentication

## Install

```bash
npm install
```

## Environment

Create a `.env` file at the project root with values like:

```bash
PORT=3000
NODE_ENV=production
SERVER_API_KEY=your_secure_api_key_here
ALLOWED_ORIGIN=http://localhost:3000
LOG_LEVEL=info
PROJECTS_DIR=/var/www
```

> Do not commit `.env` to source control.

The app now auto-discovers projects under `PROJECTS_DIR`. If there is exactly one project with a `public/uploads` folder, it will be used automatically. `UPLOADS_DIR` remains optional for fallback or legacy single-project setups.

## Run

```bash
npm start
```

## API Base URL

All routes are mounted under:

- `/api/server`

Example endpoints:

- `GET /api/server/status`
- `GET /api/server/uploads/list?projectName=<project>`
- `GET /api/server/uploads/file?path=example.txt&projectName=<project>`
- `GET /api/server/uploads/download?path=example.txt&projectName=<project>`
- `DELETE /api/server/uploads/delete?path=example.txt&projectName=<project>`
- `GET /api/server/uploads/projects`
- `GET /api/server/processes`
- `POST /api/server/processes/restart`
- `GET /api/server/storage`
- `GET /api/server/logs/all`
- `GET /api/server/logs/projects`
- `GET /api/server/logs/git-history?projectName=<project>`

## Deployment

Recommended production setup:

- Run the project on Node.js 20+.
- Install dependencies with `npm install` and start with `npm start` or a process manager such as `pm2` or `systemd`.
- Set `NODE_ENV=production`, `SERVER_API_KEY`, `PROJECTS_DIR`, `ALLOWED_ORIGIN`, and `LOG_LEVEL`.
- Use HTTPS and run the API behind a reverse proxy such as Nginx.
- Confirm the target host has the expected Linux tools and permissions for system endpoints (`pm2`, `journalctl`, `nginx`, etc.).
- `PROJECTS_DIR` is used for auto-discovering project upload folders.

## Security

- The API requires the header `x-api-key` on all `/api/server/*` requests.
- Keep the API key secret and rotate it if needed.
- Use `ALLOWED_ORIGIN` to restrict browser-based CORS access.
- Do not expose system or log endpoints publicly without additional network restrictions.
- Keep `.env` out of source control and never commit secrets.

## Maintenance

- Keep dependencies up to date and review changelogs before upgrading.
- Rotate `SERVER_API_KEY` regularly and use strong random values.
- Monitor server logs and audit API access.
- Use `git status` to verify `node_modules`, `.env`, and any secret files are not committed.
- Review auto-discovery behavior after adding or removing projects under `PROJECTS_DIR`.

## Recommended next steps before public deployment

- Add automated tests for key routes and services
- Add a `CONTRIBUTING.md` file for repo contributions
- Add or review `LICENSE` for non-commercial use only
- Review and scope system/log endpoints before exposing them publicly
- Add monitoring, alerting, and log retention for production

## Notes

- This repository is currently structured for server management on a Linux host.
- The file service is protected by path sanitization and base directory enforcement.
- The project is designed to be modular and easier to extend.
