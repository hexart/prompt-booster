# Prompt Booster UI Component Library

[中文文档](README-zh.md)

## Overview

The Prompt Booster UI library provides a comprehensive set of React components designed specifically for prompt engineering and optimization applications. This library offers a collection of components ranging from basic UI elements to specialized prompt editing components, with full support for light and dark themes.

## Installation

```bash
# Using npm
npm install @prompt-booster/ui

# Using yarn
yarn add @prompt-booster/ui

# Using pnpm
pnpm add @prompt-booster/ui
```

## Dependencies

The library has the following peer dependencies:

```json
"peerDependencies": {
  "lucide-react": "^0.488.0",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "react-hotkeys-hook": "^5.0.1",
  "@tailwindcss/vite": "^4.1.4",
  "tailwindcss": "^4.1.4",
  "tailwindcss-animate": "^1.0.7"
}
```

Ensure these dependencies are installed in your project.

## Core Components

### Display Components

#### `AutoScrollContent`

A component for displaying content with automatic scrolling functionality, particularly useful for streaming content.

```jsx
import { AutoScrollContent } from '@prompt-booster/ui';

<AutoScrollContent
  content="This is some sample content."
  streaming={true}
  enableMarkdown={true}
  allowHtml={false}
  showCopyButton={true}
  placeholder="No content to display"
/>
```

Props:

- `content`: The text content to display
- `streaming`: Whether content is being streamed
- `enableMarkdown`: Whether to render Markdown
- `allowHtml`: Whether to allow HTML in Markdown
- `showCopyButton`: Whether to show the copy button
- `placeholder`: Text to display when content is empty

#### `Markdown`

A Markdown renderer with syntax highlighting and specialized handling of "think" blocks.

```jsx
import { Markdown } from '@prompt-booster/ui';

<Markdown
  content="# Hello World\nThis is a **Markdown** sample."
  allowHtml={false}
  streaming={false}
/>
```

Props:

- `content`: Markdown content to render
- `allowHtml`: Whether to allow HTML in Markdown
- `streaming`: Whether content is being streamed
- `className`: Additional CSS classes
- `style`: Inline styles

### Input Components

#### `AutoScrollTextarea`

A textarea component with auto-scrolling functionality, ideal for input fields where content is continuously added.

```jsx
import { AutoScrollTextarea } from '@prompt-booster/ui';

<AutoScrollTextarea
  value={inputValue}
  onChange={handleChange}
  streaming={false}
  placeholder="Enter your prompt..."
  showCopyButton={true}
  centerPlaceholder={true}
/>
```

Props:

- `value`: The textarea content
- `onChange`: Change handler function
- `streaming`: Whether content is being streamed
- `showCopyButton`: Whether to show the copy button
- `centerPlaceholder`: Whether to center the placeholder
- `placeholder`: Placeholder text

#### `EnhancedTextarea`

A feature-rich textarea component with character counting and copy functionality.

```jsx
import { EnhancedTextarea } from '@prompt-booster/ui';

<EnhancedTextarea
  value={text}
  onChange={handleChange}
  placeholder="Enter text..."
  rows={5}
  showCharCount={true}
  maxLength={1000}
  label="Description"
/>
```

Props:

- `value`: The textarea content
- `onChange`: Change handler function
- `placeholder`: Placeholder text
- `rows`: Number of visible rows
- `showCharCount`: Whether to show character count
- `maxLength`: Maximum allowed characters
- `label`: Label text for the textarea

#### `EnhancedDropdown`

A dropdown component with search and keyboard navigation features.

```jsx
import { EnhancedDropdown } from '@prompt-booster/ui';

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' }
];

<EnhancedDropdown
  options={options}
  value={selectedValue}
  onChange={handleChange}
  placeholder="Select an option"
/>
```

Props:

- `options`: Array of option objects with value and label
- `value`: Currently selected value
- `onChange`: Change handler function
- `placeholder`: Placeholder text
- `disabled`: Whether the dropdown is disabled

#### `ModelSelector`

A specialized dropdown for selecting AI models with search functionality.

```jsx
import { ModelSelector } from '@prompt-booster/ui';

<ModelSelector
  value={selectedModel}
  onChange={setSelectedModel}
  fetchModels={fetchModelsFunction}
  placeholder="Select a model"
/>
```

Props:

- `value`: Currently selected model ID
- `onChange`: Change handler function
- `fetchModels`: Function that returns a Promise resolving to model options
- `placeholder`: Placeholder text
- `onFetch`: Callback when models are fetched

### Dialog and Modal Components

#### `Dialog`

A customizable dialog/modal component with animations and portal rendering.

```jsx
import { Dialog } from '@prompt-booster/ui';

<Dialog
  isOpen={isDialogOpen}
  onClose={closeDialog}
  title="Dialog Title"
  footer={<div>Dialog Footer</div>}
  maxWidth="max-w-2xl"
>
  <div>Dialog content goes here</div>
</Dialog>
```

Props:

- `isOpen`: Whether the dialog is visible
- `onClose`: Function to call when dialog should close
- `title`: Dialog title
- `children`: Dialog content
- `footer`: Optional footer content
- `maxWidth`: Maximum width (Tailwind class)
- `showCloseButton`: Whether to show the close button

#### `DraggableNotice`

A draggable notification component for displaying important messages.

```jsx
import { DraggableNotice } from '@prompt-booster/ui';

const items = [
  { text: "API key is required", isNeeded: true },
  { text: "Select a model", isNeeded: true }
];

<DraggableNotice
  items={items}
  title="Required Steps"
  onClose={handleClose}
/>
```

Props:

- `items`: Array of notification items with text and isNeeded flag
- `title`: Notice title
- `onClose`: Function to call when notice is closed
- `initialPosition`: Initial position object with x and y coordinates
- `className`: Additional CSS classes

### Theme Components

#### `ThemeProvider`

Provider component for theme context.

```jsx
import { ThemeProvider } from '@prompt-booster/ui';

<ThemeProvider defaultTheme="system">
  <App />
</ThemeProvider>
```

Props:

- `defaultTheme`: Default theme ('light', 'dark', or 'system')
- `storageKey`: Key for storing theme preference in localStorage
- `children`: Application components

#### `ThemeSwitcher`

A component for switching between light, dark, and system themes.

```jsx
import { ThemeSwitcher } from '@prompt-booster/ui';

<ThemeSwitcher
  iconSize={20}
  enableHotkeys={true}
/>
```

Props:

- `iconSize`: Size of the theme icons
- `enableHotkeys`: Whether to enable keyboard shortcuts

#### `Toaster`

A notification component based on sonner.

```jsx
import { Toaster, toast } from '@prompt-booster/ui';

<Toaster />

// Later in your code
toast.success("Operation completed successfully");
```

#### `Tooltip`

A customizable tooltip component.

```jsx
import { Tooltip } from '@prompt-booster/ui';

<Tooltip text="Copy to clipboard" position="top">
  <button>Copy</button>
</Tooltip>
```

Props:

- `text`: Tooltip text
- `content`: React node content (alternative to text)
- `position`: Tooltip position ('top', 'bottom', 'left', 'right')
- `theme`: Theme override
- `duration`: Animation duration
- `children`: Element to attach tooltip to

### Utility Components

#### `ListCard`

A card component designed for displaying list items with actions.

```jsx
import { ListCard } from '@prompt-booster/ui';

<ListCard
  title="Item Title"
  description="Item description"
  infoItems={[
    { key: "Created", value: "Today" },
    { key: "Status", value: "Active" }
  ]}
  actions={<button>Edit</button>}
  onClick={handleClick}
/>
```

Props:

- `title`: Card title
- `description`: Card description
- `infoItems`: Array of info items with key and value
- `actions`: Actions to display on the right
- `onClick`: Click handler function
- `renderTitle`: Custom title renderer
- `renderDescription`: Custom description renderer
- `renderInfoItem`: Custom info item renderer

#### `LoadingIcon`

A customizable loading spinner.

```jsx
import { LoadingIcon } from '@prompt-booster/ui';

<LoadingIcon size="md" color="currentColor" />
```

Props:

- `size`: Size of the spinner ('sm', 'md', 'lg')
- `color`: Color of the spinner

## Hooks

### `useAutoScroll`

A hook for managing automatic scrolling behavior.

```jsx
import { useAutoScroll } from '@prompt-booster/ui';

function MyComponent() {
  const {
    elementRef,
    scrollToBottom,
    shouldShowButton,
    onContentChange
  } = useAutoScroll({
    streaming: true,
    threshold: 10
  });
  
  return (
    <div ref={elementRef}>
      {/* Content */}
      {shouldShowButton && (
        <button onClick={scrollToBottom}>Scroll to Bottom</button>
      )}
    </div>
  );
}
```

Options:

- `enabled`: Whether auto-scroll is enabled
- `streaming`: Whether content is being streamed
- `threshold`: Threshold in pixels to detect if scrolled away from bottom
- `debug`: Whether to output debug information

### `useModal`

A hook for managing modal/dialog state.

```jsx
import { useModal, Dialog } from '@prompt-booster/ui';

function UserEditor() {
  const userModal = useModal();
  
  const openUserModal = (userData) => {
    userModal.openModal(userData);
  };
  
  return (
    <>
      <button onClick={() => openUserModal({ id: 1, name: 'John' })}>
        Edit User
      </button>
      
      {(userModal.isOpen || userModal.isClosing) && userModal.data && (
        <Dialog
          isOpen={userModal.isOpen}
          onClose={userModal.closeModal}
          title="Edit User"
        >
          <input
            value={userModal.data.name}
            onChange={(e) => userModal.setData({
              ...userModal.data,
              name: e.target.value
            })}
          />
        </Dialog>
      )}
    </>
  );
}
```

Returns:

- `isOpen`: Whether the modal is open
- `isClosing`: Whether the modal is in closing animation
- `data`: The modal data
- `openModal`: Function to open the modal with data
- `closeModal`: Function to close the modal
- `setData`: Function to update the modal data

### `useScrollFade`

A hook for creating fade-in/fade-out scrollbars.

```jsx
import { useScrollFade } from '@prompt-booster/ui';

function ScrollableContent() {
  const containerRef = useRef(null);
  const { applyToAll } = useScrollFade(containerRef, {
    timeout: 2000,
    showOnHover: true
  });
  
  // Apply to all scrollable elements in the component
  useEffect(() => {
    const cleanup = applyToAll();
    return cleanup;
  }, [applyToAll]);
  
  return (
    <div ref={containerRef} className="overflow-auto">
      {/* Scrollable content */}
    </div>
  );
}
```

Options:

- `timeout`: Time in milliseconds before scrollbars fade out
- `showOnHover`: Whether to show scrollbars on hover
- `listenToScroll`: Whether to listen to scroll events
- `selector`: CSS selector for scrollable elements

## Theme System

The UI library includes a comprehensive theme system supporting light, dark, and system preference modes.

### Theme Context

The `ThemeContext` provides theme state and functions:

```jsx
import { useTheme } from '@prompt-booster/ui';

function MyComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
      <button onClick={() => setTheme('light')}>Light Mode</button>
      <button onClick={() => setTheme('system')}>System Preference</button>
    </div>
  );
}
```

The `resolvedTheme` will be either 'light' or 'dark', while `theme` can be 'light', 'dark', or 'system'.

### CSS Classes

Components use consistent CSS class naming for theming:

- Light theme active: `theme-light-active`
- Light theme inactive: `theme-light-inactive`
- Dark theme active: `theme-dark-active`
- Dark theme inactive: `theme-dark-inactive`

## Advanced Usage

### Dialog with useModal Pattern

For more complex dialog management, combine the `Dialog` component with the `useModal` hook:

```jsx
import { Dialog, useModal } from '@prompt-booster/ui';

// Define a type for the modal data
interface UserData {
  id: number;
  name: string;
  email: string;
}

function UserManagement() {
  // Create a typed modal hook
  const userModal = useModal<UserData>();
  
  const handleEditUser = (user: UserData) => {
    userModal.openModal(user);
  };
  
  const handleSaveUser = () => {
    // Save user data
    console.log('Saving user:', userModal.data);
    userModal.closeModal();
  };
  
  return (
    <div>
      {/* Trigger button */}
      <button onClick={() => handleEditUser({ id: 1, name: 'John', email: 'john@example.com' })}>
        Edit User
      </button>
      
      {/* User edit dialog */}
      {(userModal.isOpen || userModal.isClosing) && userModal.data && (
        <Dialog
          isOpen={userModal.isOpen}
          onClose={userModal.closeModal}
          title={`Edit User: ${userModal.data.name}`}
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={userModal.closeModal}>Cancel</button>
              <button onClick={handleSaveUser}>Save</button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label>Name</label>
              <input
                value={userModal.data.name}
                onChange={(e) => userModal.setData({
                  ...userModal.data,
                  name: e.target.value
                })}
              />
            </div>
            <div>
              <label>Email</label>
              <input
                value={userModal.data.email}
                onChange={(e) => userModal.setData({
                  ...userModal.data,
                  email: e.target.value
                })}
              />
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
```

### Auto-Scrolling Markdown Content

For displaying streaming AI responses with automatic scrolling:

```jsx
import { AutoScrollContent } from '@prompt-booster/ui';

function AIResponseDisplay({ response, isStreaming }) {
  return (
    <div className="h-80">
      <AutoScrollContent
        content={response}
        streaming={isStreaming}
        enableMarkdown={true}
        allowHtml={false}
        showCopyButton={true}
        placeholder="AI response will appear here..."
      />
    </div>
  );
}
```

### Model Selection with Dynamic Loading

```jsx
import { ModelSelector } from '@prompt-booster/ui';
import { fetchModels } from '@prompt-booster/api';

function ModelSelectionForm() {
  const [selectedModel, setSelectedModel] = useState('');
  
  const loadModels = async () => {
    try {
      // Function that returns a Promise<ModelOption[]>
      const models = await fetchModels();
      return models;
    } catch (error) {
      console.error('Error loading models:', error);
      return [];
    }
  };
  
  return (
    <div>
      <label>Select AI Model</label>
      <ModelSelector
        value={selectedModel}
        onChange={setSelectedModel}
        fetchModels={loadModels}
        placeholder="Search or select a model"
      />
    </div>
  );
}
```

## Best Practices

### Theme Consistency

Ensure your application properly uses the theme context:

```jsx
import { ThemeProvider } from '@prompt-booster/ui';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      {/* Your application */}
    </ThemeProvider>
  );
}
```

### Form Design

When creating forms, use consistent input components:

```jsx
function ConsistentForm() {
  return (
    <form className="space-y-4">
      <div>
        <label>Title</label>
        <EnhancedTextarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title"
          rows={1}
        />
      </div>
      
      <div>
        <label>Description</label>
        <EnhancedTextarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
          rows={3}
          showCharCount={true}
          maxLength={500}
        />
      </div>
      
      <div>
        <label>Category</label>
        <EnhancedDropdown
          options={categories}
          value={selectedCategory}
          onChange={setSelectedCategory}
          placeholder="Select a category"
        />
      </div>
    </form>
  );
}
```

### Error Handling

Implement consistent error handling with the Toaster component:

```jsx
import { toast } from '@prompt-booster/ui';

async function submitForm() {
  try {
    // Form submission logic
    await saveData();
    toast.success('Form submitted successfully');
  } catch (error) {
    toast.error('Error submitting form: ' + error.message);
  }
}
```

## Troubleshooting

### Common Issues

**Components not showing proper theme colors:**

- Ensure you've wrapped your application with `ThemeProvider`
- Check that you're using the provided CSS classes or Tailwind's dark mode utilities

**Auto-scrolling not working:**

- Verify the container has a fixed height or max-height
- Check that the `streaming` prop is properly set when content is being added

**Dialog animation issues:**

- Make sure you're properly handling both `isOpen` and `isClosing` states from `useModal`
- Verify your Dialog is rendered conditionally based on those states

## Utility Functions

### Toast Notifications

```jsx
import { toast } from '@prompt-booster/ui';

// Success notification
toast.success('Operation successful');

// Error notification
toast.error('Operation failed');

// Info notification
toast.info('New updates available');

// Warning notification
toast.warning('Low disk space');
```

## Conclusion

The Prompt Booster UI library provides a comprehensive set of components for building prompt engineering applications. With support for theming, responsive design, and specialized components for prompt editing and AI model interaction, it offers everything needed to create a professional prompt optimization experience.

For more detailed information on specific components, refer to the individual component documentation.