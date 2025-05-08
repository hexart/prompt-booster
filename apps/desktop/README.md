# Prompt Enhancer - Desktop Client Documentation

[中文文档](README-zh.md)

## 1. Product Overview

The Prompt Enhancer desktop client is a cross-platform application based on the Electron framework, designed to provide users with a native desktop experience. This application packages the web version of the Prompt Enhancer functionality as a standalone application, supporting Windows, macOS, and Linux operating systems, with all features available without requiring a browser.

### 1.1 Key Features

- **Native Application Experience**: Runs as a standalone desktop application without needing a browser
- **Cross-Platform Support**: Compatible with Windows, macOS (x64/ARM64), and Linux
- **Complete Feature Integration**: Includes all features from the web version
- **Local Menus and Shortcuts**: Native operating system menu and shortcut support
- **Offline Availability**: Supports local data storage, reducing network dependency
- **Unified User Interface**: Maintains consistent user experience with the web version

## 2. Technical Architecture

### 2.1 Technology Stack

- **Desktop Framework**: Electron 36.0.1
- **Build Tool**: Electron-Builder 26.0.12
- **Web Frontend**: React 19.1 + TypeScript
- **UI Framework**: Tailwind CSS 4.1
- **State Management**: Zustand 4.4

### 2.2 Project Structure

The desktop client uses the Electron framework to encapsulate the web application, primarily containing the following files:

- **main.js**: Electron main process, responsible for window management and menu creation
- **preload.js**: Preload script, providing secure inter-process communication
- **electron-builder.json**: Application packaging configuration
- **package.json**: Project dependencies and script configuration
- **web/**: Build output of the web application

## 3. Installation Guide

### 3.1 System Requirements

- **Windows**: Windows 10/11 (64-bit)
- **macOS**: macOS 10.15+ (Intel or Apple Silicon)
- **Linux**: Modern Linux distributions supporting AppImage

### 3.2 Installation Steps

#### Windows

1. Download the latest `.exe` installer package
2. Double-click the installer and follow the installation wizard
3. After installation, find "Prompt Enhancer" in the Start menu and launch it

#### macOS

1. Download the latest `.dmg` file
2. Open the DMG file
3. Drag "Prompt Enhancer" to the Applications folder
4. Launch from Launchpad or Applications folder

#### Linux

1. Download the latest `.AppImage` file
2. Grant executable permissions: `chmod +x PromptEnhancer-*.AppImage`
3. Run the AppImage file directly

### 3.3 Update Method

The application currently does not include automatic update functionality. Updates require downloading the latest version and reinstalling.

## 4. Feature Details

The desktop client retains all features of the web version and adds desktop-specific functionality:

### 4.1 Core Features

- **Prompt Enhancement**: Optimize original prompts using AI models
- **Prompt Evaluation**: Analyze and score prompt quality
- **Iterative Optimization**: Further optimize prompts based on specific directions
- **Comparison Testing**: Compare the effectiveness of original and enhanced prompts
- **Version History**: Record and manage multiple optimization versions of prompts
- **Multi-Model Support**: Integrate various AI models and custom API interfaces

### 4.2 Desktop-Specific Features

- **Native Menus**: Provide menu experiences consistent with the operating system
- **Window Controls**: Support minimize, resize, and fullscreen operations
- **Keyboard Shortcuts**: Support system standard shortcuts
- **Offline Operation**: Some features support offline use

## 5. Interface Overview

The desktop client's interface remains consistent with the web version, primarily including the following areas:

### 5.1 Main Interface

- **Top Navigation**: Provides switching between four main functional areas: "Prompt Enhancement," "Comparison Testing," "History Records," and "Model Settings"
- **Content Area**: Displays corresponding content based on the currently selected function tab
- **Bottom Status Bar**: Displays copyright information

### 5.2 Menu Structure

The desktop version provides native operating system menus, including:

- **Application Menu** (macOS): Includes hide, hide others, and quit options
- **Edit Menu**: Includes undo, redo, cut, copy, paste, and select all
- **View Menu**: Includes reload, developer tools, zoom controls, and fullscreen toggle
- **Window Menu**: Includes minimize, zoom, and close window
- **Help Menu**: Includes about information

## 6. Usage Guide

### 6.1 Prompt Enhancement Process

1. Launch the desktop application
2. Enter the original prompt in the "Prompt Enhancement" tab
3. Select the system prompt template and AI model
4. Click the "Start Enhancement" button
5. Wait for the enhancement result to generate
6. Optional: Manually edit the enhancement result and save as a new version
7. Optional: Analyze prompt quality score
8. Optional: Click "Continue Iteration" for further optimization

### 6.2 Comparison Testing Process

1. Switch to the "Comparison Testing" tab
2. Enter test content (user prompt)
3. Select the model for testing
4. Click the "Run Test" button
5. View and compare the response results on both sides
6. Optional: Turn on/off Markdown rendering
7. Optional: Maximize one side of the response for viewing

### 6.3 Using History Records

1. Switch to the "History Records" tab
2. Browse historical prompt groups
3. Click "Expand" to view detailed information
4. Switch versions to view different optimization results
5. Click "Load This Version" to load it into the editor
6. Optional: Delete unwanted records

### 6.4 Model Configuration

1. Switch to the "Model Settings" tab
2. Edit API configurations for existing models
3. Click "Add" to create custom API interfaces
4. Fill in API key, base URL, and model information
5. Test the connection to confirm the configuration is correct
6. Enable/disable the desired models

## 7. Development Guide

### 7.1 Environment Setup

Development environment requirements:

- Node.js 18.17.0 or higher
- npm or pnpm package manager
- Git

### 7.2 Build Steps

1. Clone the code repository

2. Install dependencies:

   ```bash
   cd desktop
   npm install
   ```

3. Run in development mode:

   ```bash
   npm run dev
   ```

4. Build the application:

   ```bash
   npm run build          # Build for all platforms
   npm run build:mac      # Build macOS version
   npm run build:mac:arm  # Build macOS ARM64 version
   npm run build:mac:universal # Build macOS Universal version
   npm run build:win      # Build Windows version
   npm run build:linux    # Build Linux version
   ```

### 7.3 Project Configuration Files

- **electron-builder.json**: Defines application packaging configuration, including application ID, product name, output directory, and platform-specific settings
- **package.json**: Defines project dependencies and script commands

## 8. Troubleshooting

### 8.1 Common Issues

1. **Application Cannot Start**
   - Check if the system meets minimum requirements
   - Try reinstalling the application
   - Check system logs for error information
2. **API Connection Failure**
   - Verify that the API key is correct
   - Check network connection status
   - Confirm that the API endpoint URL is correct
   - Check if firewall settings are blocking the connection
3. **Interface Display Abnormalities**
   - Try reloading the application (View menu -> Reload)
   - Check if system display settings are compatible

### 8.2 Performance Optimization

- Regularly clear history records to improve application responsiveness
- Turn off unused models to reduce resource usage
- Using local analysis instead of AI analysis can reduce network requests

## 9. Privacy and Data Security

- All API keys and configuration information are stored locally
- The application does not collect or upload user data
- Prompts and history records are saved in local storage
- Communication with AI models is initiated directly from the user's device, without going through intermediate servers

## 10. Future Plans

- Automatic update functionality
- Offline AI model support
- Multi-language interface
- Data import/export functionality
- Team collaboration features
- Cloud synchronization functionality

------

© Hexart Studio 2025