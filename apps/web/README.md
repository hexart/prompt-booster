# Prompt Booster - Web Client Documentation

[中文文档](README-zh.md)

## 1. Project Overview

Prompt Booster is a React-based web application specifically designed to optimize and improve AI prompts. This tool allows users to input original prompts, enhance them using AI models, and supports iterative improvement, quality assessment, and comparative testing of the processed prompts.

### 1.1 Core Features

- Prompt Enhancement: Optimize original prompts using AI models
- Prompt Evaluation: Analyze and score prompt quality
- Iterative Optimization: Further optimize prompts based on specific directions
- Comparative Testing: Compare the effectiveness of original prompts and enhanced prompts
- Version History: Record and manage multiple optimization versions of prompts
- Multi-model Support: Integrate various AI models and custom API interfaces

## 2. Technical Architecture

### 2.1 Technology Stack

- **Frontend Framework**: React 19.1 + TypeScript
- **Build Tool**: Vite 6.2
- **CSS Framework**: Tailwind CSS 4.1
- **State Management**: Zustand 4.4
- **UI Components**:
  - Custom UI component library (@prompt-booster/ui)
  - Framer Motion (animations)
  - Vaul (drawer components)
  - Lucide React (icons)
- **Code Quality**: ESLint + TypeScript ESLint

### 2.2 Project Structure

The project adopts a Monorepo architecture, mainly consisting of the following modules:

- **apps/web**: Web client application
- **packages/core**: Core business logic
- **packages/api**: API client and connection logic
- **packages/ui**: Reusable UI component library

## 3. Application Features in Detail

### 3.1 Prompt Booster

Prompt Booster is the main functionality of the application, located in `PromptBooster.tsx`:

#### Main Functions

- Input original prompts
- Select system prompt templates
- Choose AI models
- Execute prompt enhancement processing
- Edit enhanced prompts
- Save edits as new versions
- Analyze prompt quality
- Continue iterative optimization

#### Key Features

- **Streaming Responses**: Support for AI model streaming output, displaying enhancement results in real-time
- **Version Management**: Support for multi-version recording, allowing switching between different versions
- **Quality Analysis**: Provides both local analysis and AI-driven in-depth analysis
- **User Editing**: Allows users to manually edit enhanced prompts and save as new versions

### 3.2 Test Result

The comparative testing feature allows users to compare the performance of original prompts and enhanced prompts, located in `TestResult.tsx`:

#### Main Functions

- Input test content (user prompts)
- Select AI model for testing
- Run parallel tests of original prompts and enhanced prompts
- Compare output results
- Support Markdown rendering toggle
- Maximize/minimize control for result areas

#### Key Features

- **Parallel Testing**: Simultaneously send original prompts and enhanced prompts to the model
- **Streaming Responses**: Display model responses in real-time
- **Response Optimization**: Use RequestAnimationFrame to optimize UI updates
- **Flexible Layout**: Support different view modes for convenient comparison analysis

### 3.3 Prompt History

The history feature provides management of past prompt optimization records, located in `PromptHistory.tsx`:

#### Main Functions

- Display all prompt optimization groups
- Sort by update time
- Expand/collapse detailed information
- View optimization content of different versions
- Load history records into the editor
- Delete individual records or clear all history

#### Key Features

- **Version Comparison**: Compare optimization effects of different versions within the same group
- **Model Information**: Display AI model used for each version
- **Quick Loading**: One-click loading of historical versions into the editor for continued optimization

### 3.4 Model Settings

The model settings feature allows users to configure and manage AI model connections, located in `ModelSettings.tsx`:

#### Main Functions

- Manage built-in model configurations
- Add and edit custom API interfaces
- Test model connections
- Enable/disable models
- Delete custom interfaces

#### Key Features

- **API Key Management**: Securely store and display API keys
- **Model List Retrieval**: Automatically retrieve available models from the API
- **Connection Testing**: Verify the validity of API configurations
- **Custom Interfaces**: Support for adding interfaces from non-standard AI providers

## 4. Core Components

### 4.1 Layout Related

#### Header Component

- Provides top navigation bar and title display
- Supports theme switching functionality
- Integrates mobile menu control
- Provides keyboard shortcut control

#### MobileMenu Component

- Provides navigation menu on mobile devices
- Optimized click-outside-to-close logic
- Animated transition effects

### 4.2 Functional Components

#### IterationDialog Component

- Used for setting prompt iteration direction
- Select iteration prompt templates
- Input optimization direction description

#### ModelModal Component

- Used for editing model configuration information
- Supports API key show/hide control
- Automatic model list retrieval functionality
- Built-in validation logic

#### RefreshDetector Component

- Detects page refresh events
- Resets application state on refresh
- Uses sessionStorage for reliable detection

## 5. Custom Hooks

### 5.1 Model-Related Hooks

#### useModelConnection

- Manages model connection test status
- Provides testing connection methods
- Handles test feedback and error reporting

#### useModelEdit

- Handles saving operations for model configurations
- Supports updates for standard models and custom interfaces
- Provides success/failure feedback for saving

#### useModelData

- Retrieves and processes all model data
- Provides model enable/disable functionality
- Manages model deletion operations

#### useModelForm

- Manages model editing form state
- Handles secure display of API keys
- Automatically generates interface names

### 5.2 Other Business Hooks

#### usePromptGroup

- Manages operations for prompt groups
- Handles version switching
- Executes prompt enhancement and iteration

#### usePromptHistory

- Manages history record interactions
- Controls group expand/collapse states
- Handles version selection and loading

## 6. Configuration Files

### 6.1 Build Configuration

#### Vite Configuration (vite.config.ts)

- Configures alias resolution
- Optimizes build process
- Handles dependency packaging
- Configures development server

#### ESLint Configuration (eslint.config.js)

- TypeScript support
- React Hooks rules
- React Refresh rules

#### Tailwind Configuration (tailwind.config.js)

- Custom animations
- Theme extensions
- Dark mode support

### 6.2 TypeScript Configuration

- tsx/ts file support
- Strict type checking
- Module resolution optimization

## 7. User Guide

### 7.1 Prompt Enhancement Process

1. Input the original prompt in the "Prompt Booster" tab
2. Select system prompt template and AI model
3. Click the "Start Enhancement" button
4. Wait for enhancement results to generate
5. Optional: Manually edit enhancement results and save as a new version
6. Optional: Analyze prompt quality score
7. Optional: Click "Continue Iteration" for further optimization

### 7.2 Comparative Testing Process

1. Switch to the "Test Result" tab
2. Input test content (user prompts)
3. Select model for testing
4. Click the "Run Test" button
5. View and compare response results on both sides
6. Optional: Turn on/off Markdown rendering
7. Optional: Maximize one side of the response view

### 7.3 Using History Records

1. Switch to the "History" tab
2. Browse historical prompt groups
3. Click "Expand" to view detailed information
4. Switch versions to view different optimization results
5. Click "Load This Version" to load it into the editor
6. Optional: Delete unwanted records

### 7.4 Model Configuration

1. Switch to the "Model Settings" tab
2. Edit API configuration of existing models
3. Click "Add" to create custom API interfaces
4. Fill in API key, base URL, and model information
5. Test connection to confirm correct configuration
6. Enable/disable required models

## 8. Best Practices

### 8.1 Prompt Optimization Suggestions

- First use local analysis to evaluate prompt quality, then decide if iteration is needed
- Provide clear optimization direction for each iteration
- Regularly perform comparative tests to validate optimization effects
- Maintain version records to allow reverting to previous versions

### 8.2 Performance Optimization

- Use auto-scrolling and throttling techniques to handle streaming responses
- Prioritize local analysis, only use AI analysis when in-depth analysis is needed
- Make reasonable use of maximize/minimize controls for view layout
- Reduce unnecessary model API calls

## 9. Future Plans

- Batch testing functionality
- Prompt template library expansion
- More AI model integrations
- Team collaboration features
- Export/import prompt functionality
- Mobile application development

------

© Hexart Studio 2025 - All Rights Reserved