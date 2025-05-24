# @prompt-booster/core

[中文文档](README-zh.md)

## Table of Contents

- [@prompt-booster/core](#prompt-boostercore)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Architecture](#architecture)
  - [Core Features](#core-features)
    - [Model Management](#model-management)
      - [Example: Configuring Models](#example-configuring-models)
    - [Prompt Management](#prompt-management)
      - [Prompt Optimization](#prompt-optimization)
    - [Storage Management](#storage-management)
  - [Key Components](#key-components)
    - [Configuration](#configuration)
    - [Model Service](#model-service)
    - [Prompt Services](#prompt-services)
      - [PromptService (Main Coordinator)](#promptservice-main-coordinator)
      - [PromptGroupManager (Data Management)](#promptgroupmanager-data-management)
      - [LLMService (LLM Interface)](#llmservice-llm-interface)
    - [Template Service](#template-service)
  - [Hooks](#hooks)
    - [`useModelStore`](#usemodelstore)
    - [`usePrompt`](#useprompt)
    - [`useMemoryStore`](#usememorystore)
  - [Utilities](#utilities)
    - [ID Generation](#id-generation)
    - [Prompt Tools](#prompt-tools)
  - [Usage Examples](#usage-examples)
    - [Basic Model Configuration](#basic-model-configuration)
    - [Optimizing Prompts](#optimizing-prompts)
    - [Using Prompt History](#using-prompt-history)
    - [Analyzing Prompt Quality](#analyzing-prompt-quality)
    - [Custom API Integration](#custom-api-integration)
  - [Refactoring Highlights](#refactoring-highlights)

## Overview

The `@prompt-booster/core` package is the foundation of the Prompt Booster application, providing:

- **Unified Model Configuration Management**: Support for multiple AI models (OpenAI, Gemini, DeepSeek, Hunyuan, Siliconflow, Ollama)
- **Prompt Management**: Versioned prompt groups, history tracking, and optimization services
- **Template System**: Template-based prompt optimization and generation
- **Single Source of Truth Design**: Unified management of all prompt data through service layers
- **Storage Utilities**: Flexible storage options supporting both persistence and in-memory storage
- **Core Services**: Modular service architecture implementing separation of concerns

## Architecture

The package adopts a clear modular architecture:

```markdown
core/
├── config/         # Constants and default configurations
├── model/          # Model configuration and services
│   ├── models/     # Type definitions
│   ├── services/   # Model services
│   ├── store/      # Model state management
│   └── unifiedModelConfig.ts  # Unified model configuration
├── prompt/         # Prompt management and optimization
│   ├── hooks/      # React hooks
│   ├── models/     # Type definitions
│   ├── services/   # Core services
│   │   ├── promptService.ts       # Main service coordinator
│   │   ├── promptGroupManager.ts  # Data management
│   │   ├── llmService.ts          # LLM call interface
│   │   └── templateService.ts     # Template management
│   ├── templates/  # Prompt templates
│   └── utils/      # Utility functions
├── storage/        # Storage services
└── utils/          # Common utilities
```

## Core Features

### Model Management

The model management system provides unified configuration management through `unifiedModelConfig.ts`:

- **Unified Configuration Registry**: Centralized management of all model configurations through `MODEL_REGISTRY`
- **Supported Providers**: OpenAI, Gemini, DeepSeek, Hunyuan, Siliconflow, and Ollama
- **Custom Interfaces**: Support for adding custom APIs compatible with OpenAI interface specifications
- **Smart Recognition**: Automatic identification of OpenAI-compatible interfaces with appropriate processing logic
- **Connection Testing**: Validate API connections before submission
- **Security Management**: API key masking for enhanced security

#### Example: Configuring Models

```typescript
import { useModelStore } from '@prompt-booster/core';

function ModelConfig() {
  const { configs, updateConfig } = useModelStore();
  
  const configureOpenAI = () => {
    updateConfig('openai', {
      apiKey: 'your-api-key',
      model: 'gpt-4-turbo',
      enabled: true
    });
  };
}
```

### Prompt Management

The refactored prompt management adopts a single source of truth design:

- **Service Layering**:
  - `PromptService`: Main service coordinator managing overall processes
  - `PromptGroupManager`: Focused on data CRUD operations
  - `LLMService`: Unified LLM call interface
- **Version Control**: Complete version history recording and switching functionality
- **Real-time Updates**: Streaming responses directly update version content, UI automatically responds
- **Optimization Process**: Use AI-driven templates to enhance prompts
- **Iterative Improvement**: Gradual prompt optimization based on user feedback
- **User Editing**: Support manual editing and saving as new versions

#### Prompt Optimization

The prompt optimization system uses templates to generate better prompts:

```typescript
import { usePrompt } from '@prompt-booster/core';

function PromptOptimizer() {
  const { enhancePrompt, originalPrompt, optimizedPrompt } = usePrompt();
  
  const optimizeMyPrompt = async () => {
    const result = await enhancePrompt({
      originalPrompt: "Write a story about robots",
      templateId: "general-optimize",
      language: "en-US"
    });
    
    // Optimized content will automatically update to optimizedPrompt
    console.log(optimizedPrompt);
  };
}
```

### Storage Management

Simplified storage architecture:

- **Prompt Data**: Completely managed by `PromptService`, persisted through localStorage
- **Temporary Data**: `MemoryStore` only manages test-related temporary data
- **Storage Types**:
  - Local Storage: Persistent browser storage
  - Session Storage: Temporary browser session storage
  - Memory Storage: For temporary data, automatically cleared on page refresh
- **Auto Sync**: Through subscription mechanisms, UI automatically receives latest state

## Key Components

### Configuration

Unified model configuration management:

- **MODEL_REGISTRY**: Central configuration registry for all models
- **Default Configurations**: Preset configurations for each model
- **Dynamic Creation**: Automatic generation of default configurations based on registry

### Model Service

Model service (`model/services/modelService.ts`) provides:

- **Connection Testing**: Validate API credentials and connectivity
- **Configuration Validation**: Ensure model configurations are complete and valid
- **API Key Security**: Mask sensitive information
- **Unified Processing**: Standardized configuration handling for different providers

### Prompt Services

The refactored prompt services adopt a modular design:

#### PromptService (Main Coordinator)
- Manages overall business processes
- Coordinates various sub-services
- Handles state updates and notifications
- Implements page refresh detection

#### PromptGroupManager (Data Management)
- CRUD operations for prompt groups
- Version management
- Data import/export
- Pre-created version support for real-time updates

#### LLMService (LLM Interface)
- Unified LLM call interface
- Automatic model configuration recognition
- Support for both streaming and non-streaming responses
- Handle provider mapping for custom interfaces

### Template Service

Template service (`prompt/services/templateService.ts`) manages prompt templates:

- **Template Retrieval**: Get templates by ID or type
- **Multi-language Support**: Template localization handling
- **Default Templates**: Built-in optimization and iteration templates
- **Dynamic Loading**: Support loading templates from file system

## Hooks

### `useModelStore`

Manages model configuration state:

```typescript
const {
  activeModel,          // Current active model ID
  configs,              // Model configurations
  customInterfaces,     // Custom API interfaces
  setActiveModel,       // Set active model
  updateConfig,         // Update model configuration
  addCustomInterface,   // Add new custom interface
  getEnabledModels,     // Get all enabled models
  isCustomInterface,    // Check if it's a custom interface
  getCustomInterface    // Get custom interface configuration
} = useModelStore();
```

### `usePrompt`

Unified prompt management hook providing single source of truth:

```typescript
const {
  // State
  activeGroup,          // Current active prompt group
  activeVersion,        // Current active version
  isProcessing,         // Whether processing
  error,                // Error message
  
  // Data
  originalPrompt,       // Original prompt (directly from service)
  optimizedPrompt,      // Optimized prompt (directly from service)
  
  // Group operations
  groups,               // All prompt groups
  deleteGroup,          // Delete group
  
  // Version operations
  versions,             // All versions of current group
  switchVersion,        // Switch version
  getGroupVersions,     // Get versions of specified group
  
  // Enhancement operations
  enhancePrompt,        // Use AI to enhance prompt
  iteratePrompt,        // Iterate existing prompt
  saveUserModification, // Save user modifications
  
  // Session management
  resetSession,         // Reset current session
  loadFromHistory       // Load from history
} = usePrompt();
```

### `useMemoryStore`

Manages temporary test data:

```typescript
const {
  userTestPrompt,       // User test input
  originalResponse,     // Response from original prompt
  optimizedResponse,    // Response from optimized prompt
  isLoadingFromHistory, // Whether loading from history
  
  setUserTestPrompt,    // Set test input
  setOriginalResponse,  // Set original response
  setOptimizedResponse, // Set optimized response
  clearAll              // Clear all data
} = useMemoryStore();
```

## Utilities

### ID Generation

For generating unique identifiers:

```typescript
import { generateId, generatePrefixedId } from '@prompt-booster/core';

const uniqueId = generateId();                  // e.g.: "lq1aef3kj2"
const prefixedId = generatePrefixedId('user');  // e.g.: "user-lq1aef3kj2"
```

### Prompt Tools

Helper functions for handling prompts:

```typescript
import { 
  removeThinkTags, 
  cleanOptimizedPrompt,
  getLanguageInstruction,
  handleTemplateLocalization 
} from '@prompt-booster/core';

// Remove <think> tags from prompt
const cleanedPrompt = removeThinkTags(originalPrompt);

// Clean optimized prompt
const cleaned = cleanOptimizedPrompt(optimizedPrompt);

// Get language instruction
const instruction = getLanguageInstruction('en-US');

// Handle template localization
const { displayTemplates, getActualTemplateId } = 
  handleTemplateLocalization(templates, 'en-US');
```

## Usage Examples

### Basic Model Configuration

```typescript
import { useModelStore } from '@prompt-booster/core';

function SetupModels() {
  const { updateConfig, setActiveModel, addCustomInterface } = useModelStore();
  
  // Configure OpenAI
  updateConfig('openai', {
    apiKey: 'sk-your-openai-key',
    model: 'gpt-4-turbo',
    enabled: true
  });
  
  // Add custom interface (OpenAI compatible)
  const customId = addCustomInterface({
    name: "Local Ollama",
    providerName: "ollama",
    apiKey: "not-needed",
    baseUrl: "http://localhost:11434",
    model: "qwen2.5:32b",
    endpoint: "/api/chat",
    enabled: true
  });
  
  // Set as active model
  setActiveModel('openai');
}
```

### Optimizing Prompts

```typescript
import { usePrompt } from '@prompt-booster/core';

function PromptOptimizer() {
  const { 
    enhancePrompt, 
    originalPrompt, 
    optimizedPrompt,
    isProcessing 
  } = usePrompt();
  
  const handleOptimize = async () => {
    try {
      await enhancePrompt({
        originalPrompt: "Write a story about robots",
        templateId: 'general-optimize',
        modelId: 'openai',
        language: 'en-US'
      });
      
      // After optimization completes, optimizedPrompt will update automatically
      console.log("Optimization complete!", optimizedPrompt);
    } catch (error) {
      console.error("Optimization failed:", error);
    }
  };
  
  return (
    <div>
      <button onClick={handleOptimize} disabled={isProcessing}>
        {isProcessing ? 'Optimizing...' : 'Start Optimization'}
      </button>
    </div>
  );
}
```

### Using Prompt History

```typescript
import { usePrompt } from '@prompt-booster/core';

function PromptHistoryBrowser() {
  const { 
    groups, 
    loadFromHistory,
    switchVersion,
    getGroupVersions 
  } = usePrompt();
  
  // Display all groups
  return (
    <div>
      {groups.map(group => {
        const versions = getGroupVersions(group.id);
        
        return (
          <div key={group.id}>
            <h3>{group.originalPrompt.slice(0, 50)}...</h3>
            <button onClick={() => loadFromHistory(group.id)}>
              Load This Group
            </button>
            
            {/* Display versions */}
            <div>
              {versions.map(version => (
                <button 
                  key={version.id}
                  onClick={() => switchVersion(group.id, version.number)}
                >
                  v{version.number}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Analyzing Prompt Quality

```typescript
import { analyzePromptWithLLM, analyzePromptQuality } from '@prompt-booster/core';

async function AnalyzePrompt() {
  const myPrompt = "Write a story about a robot that can feel emotions.";
  
  try {
    // Use LLM analysis (requires configured model)
    const llmAnalysis = await analyzePromptWithLLM(myPrompt, 'en-US');
    
    console.log(`LLM Score: ${llmAnalysis.score}/10`);
    console.log(`Encouragement: ${llmAnalysis.encouragement}`);
    
    // Or use local analysis (no API required)
    const localAnalysis = analyzePromptQuality(myPrompt, 'en-US');
    
    console.log(`Local Score: ${localAnalysis.score}/10`);
    
    // Display improvement suggestions
    localAnalysis.criteria
      .filter(c => !c.passed)
      .forEach(criterion => {
        console.log(`- ${criterion.label}: ${criterion.feedback}`);
        if (criterion.suggestion) {
          console.log(`  Suggestion: ${criterion.suggestion}`);
        }
      });
  } catch (error) {
    console.error("Analysis failed:", error);
  }
}
```

### Custom API Integration

```typescript
import { useModelStore } from '@prompt-booster/core';

function AddCustomModel() {
  const { addCustomInterface, setActiveModel, testModelConnection } = useModelStore();
  
  // Add OpenAI-compatible custom interface
  const customInterface = {
    name: "FastGPT API",
    providerName: "fastgpt",
    apiKey: "fastgpt-api-key",
    baseUrl: "https://api.fastgpt.in",
    model: "gpt-4-vision-preview",
    endpoint: "/v1/chat/completions", // OpenAI compatible
    timeout: 120000,
    enabled: true
  };
  
  // Test connection
  const testResult = await testModelConnection(
    customInterface.providerName,
    customInterface.apiKey,
    customInterface.baseUrl,
    customInterface.model,
    customInterface.endpoint
  );
  
  if (testResult.success) {
    const customId = addCustomInterface(customInterface);
    setActiveModel(customId);
    console.log("Custom model added successfully!");
  } else {
    console.error("Connection test failed:", testResult.message);
  }
}
```

## Refactoring Highlights

1. **Single Source of Truth**: All prompt data is unified under `PromptService` management, eliminating the complexity of state synchronization
2. **Modular Design**: Service layers are clearly separated, with each service focusing on a single responsibility
3. **Unified Configuration**: Centralized management of all model configurations through `MODEL_REGISTRY`, reducing code duplication
4. **Real-time Updates**: Streaming responses directly update service layer data, UI automatically responds through subscriptions
5. **Type Safety**: Complete TypeScript type definitions providing better development experience