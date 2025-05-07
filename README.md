# Prompt Booster

[中文文档](README-zh.md)

A comprehensive monorepo project for optimizing and enhancing prompts for large language models (LLMs) across multiple platforms.

## Overview

Prompt Booster is a specialized tool designed to help users optimize prompts for large language models. It leverages multiple AI providers to enable prompt optimization, version control, A/B testing, and template management across different platforms.

The project follows a monorepo architecture using Turborepo and PNPM workspaces, organized into packages for shared code and platform-specific applications.

## Project Structure

```markdown
prompt-booster/
├── packages/                  # Shared cross-platform code
│   ├── core/                  # Core business logic and state management
│   ├── api/                   # API client implementations for LLM providers
│   └── ui/                    # Shared UI components
├── apps/                      # Platform-specific implementations
│   ├── web/                   # Web application
│   └── desktop/               # Electron desktop application
├── backend/                   # FastAPI backend service (planned)
├── docs/                      # Project documentation
├── docker/                    # Docker configuration files
│   ├── frontend.Dockerfile    # Frontend container build file
│   └── nginx.conf             # Nginx configuration
└── docker-compose.yml         # Docker compose configuration
```

## Core Packages

### @prompt-booster/core

The core package serves as the foundation, providing:

- Model configuration management
- Prompt management with version control
- Template system for prompt optimization
- State management with Zustand
- Storage utilities

[View Core Package Documentation](packages/core/README.md)

### @prompt-booster/api

A flexible client library for interacting with various LLM services:

- Unified interface for multiple LLM providers
- Support for OpenAI, Gemini, DeepSeek, Hunyuan, Siliconflow, and Ollama
- Streaming response handling
- Error management
- Authentication strategies

[View API Package Documentation](packages/api/README.md)

### @prompt-booster/ui

A comprehensive UI component library:

- Specialized prompt editing components
- Theme system with light/dark modes
- Dialog and modal components
- Markdown rendering with syntax highlighting
- Auto-scrolling components for streaming content

[View UI Package Documentation](packages/ui/README.md)

## Applications

### Web Application

Browser-based application for prompt optimization:

- Prompt enhancement and iteration
- Quality analysis
- A/B testing
- Version history management
- Model configuration

[View Web Application Documentation](apps/web/README.md)

### Desktop Application

Native desktop experience using Electron:

- Cross-platform support (Windows, macOS, Linux)
- Native OS menus and keyboard shortcuts
- Offline-capable functionality
- Consistent UI with web version

[View Desktop Application Documentation](apps/desktop/README.md)

## Setup and Development

### Prerequisites

- Node.js 18.17.0 or higher
- PNPM 10.9.0 or higher

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/prompt-booster.git
   cd prompt-booster
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

### Development Workflow

Start the development server for the web application:

```bash
# Build packages and start web app in development mode
pnpm dev
```

Run the desktop application in development mode:

```bash
# Start desktop app in development mode
pnpm desktop:dev
```

Build all packages and applications:

```bash
# Build all packages and applications
pnpm build
```

Clean the project:

```bash
# Clean build artifacts
pnpm clean

# Deep clean (including node_modules)
pnpm clean:all
```

### Desktop Application Building

Build desktop application packages for different platforms:

```bash
# Package for all platforms
pnpm desktop:package

# Package for macOS
pnpm desktop:package:mac
```

## Deployment

### Docker Deployment

#### Quick Start with Auto-Update

Use the following command to pull the latest image and run Prompt Booster in a container. This command will automatically update to the latest version whenever it's run:

```bash
docker pull ghcr.io/hexart/prompt-booster:latest \
&& docker rm -f prompt-booster 2>/dev/null || true \
&& docker run -d \
    --name prompt-booster \
    --restart always \
    -p 8080:80 \
    ghcr.io/hexart/prompt-booster:latest
```

This command:

- Pulls the latest image from GitHub Container Registry
- Removes any existing container named "prompt-booster"
- Creates a new container with automatic restart policy
- Maps port 8080 on your host to port 80 in the container

#### Using Docker Compose

The project also includes Docker Compose configurations for more advanced deployment:

1. Build and start the containers:

   ```bash
   docker-compose up -d
   ```

   This will:

   - Build the frontend container using `docker/frontend.Dockerfile`
   - Configure Nginx using `docker/nginx.conf`
   - Start the services defined in `docker-compose.yml`

2. Access the application at `http://localhost:8080`

### Manual Deployment

For manual deployment of the web application:

1. Build the project:

   ```bash
   pnpm build
   ```

2. The built files will be available in `apps/web/dist`

3. Deploy these files to any static web server

## Current Development Status

The project is currently in active development. According to the development roadmap:

- Phase 1 (Foundation) and Phase 2 (Advanced Features and Desktop) are completed
- Phase 3 (Enhanced Functionality) is currently in progress
- Phases 4-7 (Backend & Sync, Mobile, WeChat Mini-Program, Refinement and Launch) are planned for future development

## Project Documentation

Additional documentation is available:

- [Architecture Design](docs/architecture-design.md)
- [Backend Architecture](docs/backend-architecture.md)
- [Database Design](docs/database-design.md)
- [Development Roadmap](docs/development-roadmap.md)

## Technology Stack

- **Languages**: TypeScript, Python (backend)
- **Frontend**: React 19.1, TailwindCSS 4.1
- **State Management**: Zustand 4.4
- **Build Tools**: Vite, Turborepo, PNPM
- **Desktop**: Electron 36
- **Backend** (planned): FastAPI, PostgreSQL
- **Containerization**: Docker

## Contributing

Contributions are welcome! Please refer to the documentation for development guidance and follow the existing code style.

## License

© Hexart Studio 2025 - All Rights Reserved