# Prompt Booster Architecture Design

## 1. Overview

Prompt Booster is a comprehensive application designed to help users optimize and enhance prompts for large language models. The application leverages multiple AI providers to enable prompt optimization, version control, A/B testing, and template management across different platforms. This document outlines the architecture design for the Prompt Booster application, detailing its component structure, data flows, and implementation strategies.

## 2. System Architecture

The Prompt Booster application follows a monorepo architecture to maximize code sharing while accommodating platform-specific requirements. The system is organized into shared packages for cross-platform functionality and platform-specific applications.

### 2.1 High-Level Architecture

```
prompt-booster/
├── packages/                # Shared cross-platform code
│   └── api/                 # API client implementations for LLM providers
├── apps/                    # Platform-specific implementations
│   ├── web/                 # Web application (includes core business logic)
│   │   └── src/core/        # Core business logic and state management
│   └── desktop/             # Electron desktop application
├── backend/                 # FastAPI backend service (planned)
└── docker/                  # Docker configuration
```

### 2.2 Core Technology Stack

- **Language**: TypeScript
- **Package Management**: PNPM with workspaces
- **Monorepo Management**: Turborepo
- **State Management**: Zustand
- **Component Libraries**: React/React Native
- **Build Tools**: Vite, TSUp
- **UI Framework**: Tailwind CSS

## 3. Package Structure and Responsibilities

### 3.1 Core Module (`apps/web/src/core`)

The Core module is integrated directly into the web application, containing business logic, state management, and data models. This architecture simplifies dependencies and resolves i18n instance sharing issues in production builds.

#### Key Components:

- **Models**: Data structures and type definitions
- **Services**: Business logic implementation
- **Store**: State management using Zustand
- **Storage**: Platform-independent data persistence

#### Directory Structure:

```
apps/web/src/core/
├── config/                    # Configuration
│   ├── constants.ts           # Application constants
│   └── defaults.ts            # Default configurations
├── model/                     # Model definitions and services
│   ├── models/                # Type definitions
│   ├── services/              # Model-related services
│   └── store/                 # Model state management
├── prompt/                    # Prompt management
│   ├── models/                # Prompt data structures
│   ├── services/              # Prompt-related services
│   ├── provider/              # Template providers
│   ├── templates/             # Built-in templates
│   └── utils/                 # Prompt utilities
├── storage/                   # Storage abstractions
│   ├── memoryStorage.ts       # In-memory storage
│   └── storageService.ts      # Storage service interfaces
├── utils/                     # Utility functions
│   └── idGenerator.ts         # ID generation utilities
└── index.ts                   # Module exports
```

**Note**: React Hooks have been moved to `apps/web/src/hooks/` to separate UI concerns from pure business logic. See [Hooks Architecture](./hooks-architecture.md) for details.

### 3.2 API Package (`packages/api`)

The API package provides a unified interface for interacting with various LLM providers, abstracting away the differences between their APIs.

#### Key Components:

- **Client**: Unified LLM client implementation
- **Strategies**: Provider-specific implementations
- **Types**: API interface definitions
- **Factory**: Client creation utilities
- **Utils**: API-related utilities

#### Directory Structure:

```
packages/api/
├── src/
│   ├── client/               # Core client implementation
│   │   ├── client.ts         # Main LLM client class
│   │   └── errors.ts         # Error handling
│   ├── config/               # API configuration
│   │   ├── constants.ts      # API constants
│   │   └── models.ts         # Model configurations
│   ├── strategies/           # Provider strategies
│   │   ├── auth.ts           # Authentication strategies
│   │   ├── request.ts        # Request formatting strategies
│   │   └── response.ts       # Response parsing strategies
│   ├── types/                # Type definitions
│   │   ├── core.ts           # Core API types
│   │   └── strategies.ts     # Strategy interfaces
│   ├── utils/                # API utilities
│   │   ├── connection.ts     # Connection testing
│   │   ├── retry.ts          # Retry logic
│   │   └── stream.ts         # Streaming utilities
│   ├── factory.ts            # Client factory functions
│   └── index.ts              # Package exports
└── package.json              # Package dependencies
```





## 4. Application Architecture

### 4.1 Web Application (`apps/web`)

The web application provides a browser-based interface to the Prompt Booster functionality.

#### Key Components:

- **Pages**: Application pages
- **Components**: Web-specific components
- **Hooks**: Web-specific hooks
- **Routes**: Navigation configuration

#### Directory Structure:

```
apps/web/
├── src/
│   ├── core/                 # Core business logic (integrated)
│   ├── components/           # UI components
│   │   └── ui/               # Reusable UI components
│   │       ├── components/   # UI component implementations
│   │       ├── hooks/        # UI utility hooks (useAutoScroll, useModal)
│   │       └── docs/         # Component documentation
│   ├── hooks/                # Application-level hooks
│   │   ├── usePromptManager.ts      # Prompt management
│   │   ├── usePromptTemplates.ts    # Template management
│   │   ├── useModelConnection.ts    # Model connection testing
│   │   ├── useModelEditor.ts        # Model editing
│   │   ├── useModelData.ts          # Model data management
│   │   ├── useModelForm.ts          # Model form state
│   │   └── index.ts                 # Unified exports
│   ├── utils/                # Utility functions
│   ├── App.tsx               # Main application component
│   ├── main.tsx              # Entry point
│   └── i18n.ts               # Internationalization setup
├── public/
│   └── locales/              # Translation files
├── vite.config.ts            # Vite configuration
└── package.json              # Package dependencies
```

For detailed information about the hooks architecture, see [Hooks Architecture](./hooks-architecture.md).

### 4.2 Desktop Application (`apps/desktop`)

The desktop application uses Electron to provide a native desktop experience.

#### Key Components:

- **Main Process**: Electron main process
- **Renderer Process**: UI renderer
- **Bridge**: Communication between processes

#### Directory Structure:

```
apps/desktop/
├── src/
│   ├── main/                 # Electron main process
│   ├── renderer/             # Renderer process
│   └── bridge/               # IPC bridge
├── resources/                # Application resources
├── electron-builder.json     # Electron builder config
└── package.json              # Package dependencies
```

## 5. Data Flow and Component Interactions

### 5.1 State Management Flow

The application uses Zustand for state management, with different slices handling specific aspects of the application state.

```
┌─────────────────────────────────┐
│       Zustand Global Store      │
└───────────────┬─────────────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Model   │ │ Prompt  │ │ History │
│ Slice   │ │ Slice   │ │ Slice   │
└────┬────┘ └────┬────┘ └────┬────┘
     │           │           │
     ▼           ▼           ▼
┌─────────────────────────────────┐
│          UI Components          │
└─────────────────────────────────┘
```

### 5.2 Prompt Optimization Flow

The prompt optimization process involves several components working together:

1. User enters a prompt in the UI
2. Core service processes the prompt
3. API client sends the request to the LLM provider
4. Response is processed and stored
5. UI is updated with the optimized prompt

```
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│  UI     │ ──► │  Core   │ ──► │  API    │ ──► │  LLM    │
│Component│      │ Service │      │ Client  │      │Provider │
└─────────┘      └─────────┘      └─────────┘      └─────────┘
     ▲               │                │                │
     └───────────────┴────────────────┘◄───────────────┘
           Response Data Flow
```

### 5.3 Version Management Flow

The version management system allows users to track different iterations of a prompt:

1. User initiates prompt optimization or iteration
2. System creates a new version in the prompt group
3. Version history is updated
4. User can switch between versions

```
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ PromptEditor  │    │ promptService │    │  modelStore   │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        │  Optimize/Iterate  │                    │
        ├───────────────────►│                    │
        │                    │    Call LLM API    │
        │                    ├───────────────────►│
        │                    │                    │
        │                    │      Response      │
        │                    │◄───────────────────┤
        │                    │                    │
        │   Update Version   │                    │
        │◄───────────────────┤                    │
        │                    │                    │
┌───────┴───────┐    ┌───────┴───────┐    ┌───────┴───────┐
│ PromptEditor  │    │ promptService │    │  modelStore   │
└───────────────┘    └───────────────┘    └───────────────┘
```

## 6. Key System Features

### 6.1 Model Configuration Management

The system supports multiple LLM providers and allows users to configure their API keys, model selections, and other settings.

**Key Components:**

- `ModelConfig` interface: Defines the structure of model configuration
- `modelStore`: Manages the state of model configurations
- `modelService`: Provides utilities for testing connections and validating configs

### 6.2 Prompt Group and Version Control

The system organizes prompts into groups with version history, allowing users to track and compare different iterations.

**Key Components:**

- `PromptGroup`: Container for a prompt and its versions
- `PromptVersion`: Individual version of a prompt
- `promptGroupService`: Manages prompt groups and versions
- `usePromptGroup`: React hook for interacting with prompt groups

### 6.3 Template Management

The system includes built-in templates for different optimization strategies and allows users to create custom templates.

**Key Components:**

- `Template`: Structure for prompt templates
- `templateService`: Manages template retrieval and organization
- `FileTemplateProvider`: Provides access to built-in templates

### 6.4 Storage Abstraction

The system provides a flexible storage mechanism that can adapt to different platforms.

**Key Components:**

- `StorageType`: Enumeration of available storage types
- `createStorage`: Factory function for creating storage instances
- `memoryStorage`: In-memory storage implementation

## 7. Implementation Timeline and Strategy

### 7.1 Phase 1: Core Foundation (1-2 weeks)

- Implement the core module in web application
- Develop the basic API client framework
- Create essential UI components
- Set up the state management system

### 7.2 Phase 2: Web Application (2-3 weeks)

- Implement the web application
- Integrate core and API packages
- Develop the user interface
- Test and optimize performance

### 7.3 Phase 3: Desktop Application (2-3 weeks)

- Implement the Electron desktop application
- Adapt the UI for desktop
- Create installers for different platforms
- Test and optimize for desktop usage

### 7.4 Phase 4: Mobile and WeChat (Future)

- Develop the React Native mobile application
- Create the WeChat mini-program
- Adapt the UI for smaller screens
- Test on mobile devices

## 8. Security Considerations

### 8.1 API Key Management

- API keys are stored securely and masked when displayed
- Users can enable/disable different models

### 8.2 Data Storage

- Sensitive data is stored locally by default
- Optional cloud synchronization with encryption

### 8.3 Error Handling

- Standardized error handling across the application
- Informative error messages for users

## 9. Extensibility

### 9.1 Adding New LLM Providers

The system is designed to easily accommodate new LLM providers:

1. Create provider-specific authentication, request, and response strategies
2. Add provider configuration to constants
3. Update the model configuration UI

### 9.2 New Features

The modular architecture allows for easy addition of new features:

- New optimization strategies can be added as templates
- Additional UI components can be integrated
- New storage providers can be implemented

## 10. Conclusion

The Prompt Booster architecture provides a solid foundation for a cross-platform application that helps users optimize prompts for large language models. The monorepo structure with shared packages enables efficient code reuse while allowing for platform-specific customizations.

The modular organization of code by responsibility creates clear separation of concerns, making the codebase easier to maintain and extend. Each component has a well-defined purpose, and the interaction between components follows established patterns.

This architecture ensures that the application is:

- **Maintainable**: Clear code organization and separation of concerns
- **Scalable**: Ready for additional features and platforms
- **Consistent**: Unified behavior across different environments
- **Efficient**: Maximum code reuse and optimized workflows

Following this architecture will result in a robust, user-friendly application that provides significant value for prompt engineering and optimization across various LLM providers.
