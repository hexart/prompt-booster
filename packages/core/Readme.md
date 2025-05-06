1. # @prompt-booster/core

   Core package for Prompt Booster providing essential state management, model configurations, prompt optimization services, and utility functions.

   ## Table of Contents

   1. [Overview](#overview)
   2. [Architecture](#architecture)
   3. Core Features
      - [Model Management](#model-management)
      - [Prompt Management](#prompt-management)
      - [Storage Management](#storage-management)
   4. Key Components
      - [Configuration](#configuration)
      - [Model Service](#model-service)
      - [Prompt Service](#prompt-service)
      - [Template Service](#template-service)
   5. [Hooks](#hooks)
   6. [Utilities](#utilities)
   7. [Usage Examples](#usage-examples)

   ## Overview

   The `@prompt-booster/core` package serves as the foundation for the Prompt Booster application, providing:

   - **Model Configuration Management**: Support for multiple AI models (OpenAI, Gemini, DeepSeek, Hunyuan, Siliconflow, Ollama)
   - **Prompt Management**: Versioned prompt groups, history tracking, and optimization services
   - **Template System**: Template-based prompt optimization and generation
   - **State Management**: Zustand-based reactive stores for application state
   - **Storage Utilities**: Persistent and memory-based storage options
   - **Core Services**: Interfaces for prompt optimization and AI model communication

   ## Architecture

   The package is organized into several key modules:

   ```markdown
   core/
   ├── config/        # Constants and default configurations
   ├── model/         # Model configuration and services
   ├── prompt/        # Prompt management and optimization
   ├── storage/       # Storage services
   └── utils/         # Utility functions
   ```

   ## Core Features

   ### Model Management

   The model management system provides a flexible framework for working with different AI providers:

   - **Supported Providers**: OpenAI, Gemini, DeepSeek, Hunyuan, Siliconflow, and Ollama
   - **Custom Interfaces**: Support for adding and configuring custom API endpoints
   - **Model Configuration**: API keys, base URLs, model selection, and timeout settings
   - **Connection Testing**: Test API connections before committing to a model
   - **Secure Key Management**: API key masking for enhanced security

   #### Example: Configuring a Model

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

   Prompt management provides comprehensive tools for working with AI prompts:

   - **Prompt Groups**: Organize prompts into groups with version history
   - **Versioning**: Track changes to prompts with sequential versions
   - **Optimization**: Enhance prompts using AI-driven templates
   - **Iteration**: Incrementally improve prompts based on feedback
   - **History**: Browse and recover previous prompt versions
   - **Analysis**: Analyze prompt quality with AI feedback

   #### Prompt Optimization

   The prompt optimization system uses templates to generate better prompts:

   ```typescript
   import { usePromptGroup } from '@prompt-booster/core';
   
   function PromptOptimizer() {
     const { enhancePrompt } = usePromptGroup();
     
     const optimizeMyPrompt = async () => {
       const result = await enhancePrompt({
         originalPrompt: "Write a story about a robot",
         templateId: "default-optimizer"
       });
       
       console.log(result.optimizedPrompt);
     };
   }
   ```

   ### Storage Management

   The package offers flexible storage solutions:

   - **Local Storage**: Persistent browser storage
   - **Session Storage**: Temporary browser session storage
   - **Memory Storage**: In-memory storage for ephemeral data
   - **Zustand Integration**: Seamless integration with Zustand state management

   ## Key Components

   ### Configuration

   Located in the `config/` directory, the configuration module defines constants and default settings:

   - **Constants**: API endpoints, model names, storage keys, error messages
   - **Defaults**: Default model configurations and optimization settings

   ### Model Service

   The model service (`model/services/modelService.ts`) provides utilities for:

   - **Connection Testing**: Verify API credentials and connectivity
   - **API Key Security**: Mask sensitive API keys for display
   - **Model Validation**: Validate model configurations
   - **UI Preparation**: Format model data for display in the UI

   ### Prompt Service

   The prompt service (`prompt/services/promptService.ts`) is the core engine for prompt management:

   - **LLM Communication**: Generic function for calling AI models
   - **Prompt Group Management**: Create, update, and delete prompt groups
   - **Version Control**: Track changes to prompts over time
   - **Optimization**: Enhance prompts using AI
   - **Iteration**: Improve prompts based on specific directions
   - **State Management**: Maintain prompt state across the application

   ### Template Service

   The template service (`prompt/services/templateService.ts`) manages prompt templates:

   - **Template Retrieval**: Get templates by ID or type
   - **Default Templates**: Built-in templates for common optimization scenarios
   - **Template Content**: Extract content from templates for use in prompt optimization

   ## Hooks

   The package provides several React hooks for state management:

   ### `useModelStore`

   Manages model configuration state:

   ```typescript
   const {
     activeModel,          // Current active model ID
     configs,              // Model configurations
     customInterfaces,     // Custom API interfaces
     setActiveModel,       // Set the active model
     updateConfig,         // Update a model configuration
     addCustomInterface,   // Add a new custom interface
     getEnabledModels      // Get all enabled models
   } = useModelStore();
   ```

   ### `usePromptGroup`

   Manages prompt groups and versions:

   ```typescript
   const {
     activeGroup,          // Current active prompt group
     activeVersion,        // Current active version
     enhancePrompt,        // Enhance a prompt using AI
     iteratePrompt,        // Iterate on an existing prompt
     getAllGroups,         // Get all prompt groups
     getGroupVersions,     // Get versions for a group
     loadFromHistory       // Load a prompt from history
   } = usePromptGroup();
   ```

   ### `usePromptHistory`

   Manages prompt history navigation:

   ```typescript
   const {
     expandedGroupId,      // Currently expanded group
     selectedVersions,     // Selected versions by group
     toggleExpand,         // Toggle expansion of a group
     loadGroup,            // Load a prompt group
     loadVersion           // Load a specific version
   } = usePromptHistory();
   ```

   ### `useMemoryStore`

   Manages in-memory prompt data:

   ```typescript
   const {
     originalPrompt,       // Original prompt text
     optimizedPrompt,      // Optimized prompt text
     setOriginalPrompt,    // Set original prompt
     setOptimizedPrompt,   // Set optimized prompt
     clearAll              // Clear all stored data
   } = useMemoryStore();
   ```

   ## Utilities

   ### ID Generation

   Utilities for generating unique identifiers:

   ```typescript
   import { generateId, generatePrefixedId } from '@prompt-booster/core';
   
   const uniqueId = generateId();                  // e.g., "lq1aef3kj2"
   const prefixedId = generatePrefixedId('user');  // e.g., "user-lq1aef3kj2"
   ```

   ### Prompt Utilities

   Helper functions for working with prompts:

   ```typescript
   import { removeThinkTags, analyzePromptQuality } from '@prompt-booster/core';
   
   // Remove <think> tags from a prompt
   const cleanedPrompt = removeThinkTags(originalPrompt);
   
   // Analyze prompt quality
   const analysis = analyzePromptQuality(myPrompt);
   console.log(`Quality score: ${analysis.score}/10`);
   ```

   ## Usage Examples

   ### Basic Model Configuration

   ```typescript
   import { useModelStore } from '@prompt-booster/core';
   
   function SetupModels() {
     const { updateConfig, setActiveModel } = useModelStore();
     
     // Configure OpenAI
     updateConfig('openai', {
       apiKey: 'sk-your-openai-key',
       model: 'gpt-4-turbo',
       enabled: true
     });
     
     // Set OpenAI as active model
     setActiveModel('openai');
   }
   ```

   ### Optimizing a Prompt

   ```typescript
   import { usePromptGroup, useMemoryStore } from '@prompt-booster/core';
   
   async function OptimizePrompt() {
     const { enhancePrompt } = usePromptGroup();
     const { setOriginalPrompt, setOptimizedPrompt } = useMemoryStore();
     
     const originalPrompt = "Write a story about a robot.";
     setOriginalPrompt(originalPrompt);
     
     try {
       const result = await enhancePrompt({
         originalPrompt,
         templateId: 'default-optimizer'
       });
       
       setOptimizedPrompt(result.optimizedPrompt);
       console.log("Optimization complete!");
     } catch (error) {
       console.error("Optimization failed:", error);
     }
   }
   ```

   ### Working with Prompt History

   ```typescript
   import { usePromptGroup, usePromptHistory } from '@prompt-booster/core';
   
   function PromptHistoryBrowser() {
     const { getAllGroups, getGroupVersions } = usePromptGroup();
     const { loadGroup, loadVersion } = usePromptHistory();
     
     // Get all prompt groups
     const groups = getAllGroups();
     
     // Load the first group
     if (groups.length > 0) {
       // Get all versions for the first group
       const versions = getGroupVersions(groups[0].id);
       
       // Load the latest version
       loadGroup(groups[0], () => {
         console.log("Group loaded successfully!");
       });
       
       // Or load a specific version
       if (versions.length > 1) {
         loadVersion(groups[0].id, versions[1].number, () => {
           console.log("Version loaded successfully!");
         });
       }
     }
   }
   ```

   ### Analyzing Prompt Quality

   ```typescript
   import { analyzePromptWithLLM } from '@prompt-booster/core';
   
   async function AnalyzePrompt() {
     const myPrompt = "Write a story about a robot that feels emotions.";
     
     try {
       const analysis = await analyzePromptWithLLM(myPrompt);
       
       console.log(`Quality score: ${analysis.score}/10`);
       console.log("Areas for improvement:");
       
       analysis.criteria
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
     const { addCustomInterface, setActiveModel } = useModelStore();
     
     // Add a custom model interface
     const customId = addCustomInterface({
       name: "My Custom AI",
       providerName: "CustomProvider",
       apiKey: "custom-api-key",
       baseUrl: "https://api.custom-ai-provider.com",
       model: "custom-model-v1",
       timeout: 60000,
       enabled: true
     });
     
     // Set as active model
     setActiveModel(customId);
   }
   ```
