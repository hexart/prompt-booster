# Prompt Booster
![Prompt Booster](img/banner.svg)

[中文文档](README-zh.md) [Online experience](https://hexart.github.io/prompt-booster/)

A comprehensive monorepo project for optimizing and enhancing prompts for large language models (LLMs) across multiple platforms.

![License: MIT/Apache-2.0](https://img.shields.io/badge/License-MIT%2FApache--2.0-blue.svg)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Electron](https://img.shields.io/badge/Electron-38.2-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-5.0-orange)](https://zustand-demo.pmnd.rs/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
![Cross Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Desktop-lightgrey)

## Overview

Prompt Booster is a specialized tool designed to help users optimize prompts for large language models. It leverages multiple AI providers to enable prompt optimization, version control, A/B testing, and template management across different platforms.

The project follows a monorepo architecture using Turborepo and PNPM workspaces, organized into packages for shared code and platform-specific applications.

https://github.com/user-attachments/assets/d4ab19f8-9f23-4c95-97f1-7dba5fb6b5b9

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

**Important Note**: The desktop application is intentionally managed as a completely independent package outside the main project structure. Unlike other packages in this monorepo which use pnpm, the desktop package exclusively uses npm for dependency management due to compatibility issues between pnpm and Electron Builder. The desktop client consumes the compiled web application but maintains its own build process and dependency tree. For detailed compilation and development instructions, please refer to the [Desktop Application Documentation](apps/desktop/README.md).

[View Desktop Application Documentation](apps/desktop/README.md)

## Setup and Development

### Prerequisites

- Node.js 18.17.0 or higher
- PNPM 10.9.0 or higher

### Installation

1. Install Node.js:

   - Download and install Node.js 18.17.0 or higher from [the official Node.js website](https://nodejs.org/)
   - Verify the installation by running `node -v` and `npm -v` in your terminal

2. Install pnpm:

   ```bash
   # Using npm
   npm install -g pnpm
   
   # Or using the recommended standalone script
   curl -fsSL https://get.pnpm.io/install.sh | sh -
   
   # Verify installation
   pnpm --version
   ```

3. Clone the repository:

   ```bash
   git clone https://github.com/hexart/prompt-booster.git
   cd prompt-booster
   ```

4. Install dependencies:

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
cd apps/desktop
npm install
npm run dev
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
cd apps/desktop
# Package for all platforms
npm run build

# Package for macOS
npm run build:mac
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
- **State Management**: Zustand 5.0
- **Build Tools**: Vite, Turborepo, PNPM
- **Desktop**: Electron 37
- **Backend** (planned): FastAPI, PostgreSQL
- **Containerization**: Docker

## Contributing

Contributions are welcome! Please refer to our [Contributing Guide](CONTRIBUTING.md) for detailed instructions on how to contribute to this project.

- 📋 [Contributing Guide](CONTRIBUTING.md) - How to fork, develop, and submit pull requests
- 🐛 [Report Issues](https://github.com/hexart/prompt-booster/issues) - Report bugs or request features  

Please follow the existing code style and development guidelines outlined in the contributing guide.

## Acknowledgements

This project was inspired by and builds upon [prompt-optimizer](https://github.com/linshenkx/prompt-optimizer) by [linshenkx](https://github.com/linshenkx). We would like to express our sincere gratitude for their pioneering work in the field of prompt engineering and optimization. Their open-source contribution under the MIT license has been instrumental in the development of Prompt Booster. We highly recommend checking out their original project.

## License

This project is licensed under the terms of both the MIT license and the Apache License 2.0, at your option.

- MIT License ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)
- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)

© Hexart Studio 2025 [![Hits](https://hits.sh/hexart.github.io/prompt-booster.svg?color=1196cc)](https://hits.sh/hexart.github.io/prompt-booster/)
