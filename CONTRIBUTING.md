# Contributing to Prompt Booster

We welcome contributions to Prompt Booster! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18.17.0 or higher
- PNPM 10.9.0 or higher
- Git

### Fork and Clone

1. **Fork the repository**
   - Visit [https://github.com/hexart/prompt-booster](https://github.com/hexart/prompt-booster)
   - Click the "Fork" button in the top-right corner
   - This creates a copy of the repository in your GitHub account

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/prompt-booster.git
   cd prompt-booster
   ```

3. **Add the original repository as upstream**
   ```bash
   git remote add upstream https://github.com/hexart/prompt-booster.git
   ```

### Development Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start the development server**
   ```bash
   pnpm dev
   ```

3. **Verify everything works**
   - Open your browser and navigate to `http://localhost:3000`
   - Ensure the application loads correctly

## Making Changes

### Creating a Branch

Always create a new branch for your changes:

```bash
# Ensure you're on the main branch and it's up to date
git checkout main
git pull upstream main

# Create and switch to a new branch
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/feature-name` - for new features
- `fix/bug-description` - for bug fixes
- `docs/documentation-update` - for documentation changes
- `refactor/component-name` - for code refactoring
- `test/test-description` - for adding or updating tests

### Making Your Changes

1. **Make your changes** in your feature branch
2. **Test your changes thoroughly**
   ```bash
   # Run tests
   pnpm test
   
   # Build to ensure no build errors
   pnpm build
   
   # Check code style
   pnpm lint
   ```

3. **Commit your changes**
   - Write clear, descriptive commit messages
   - Follow the conventional commit format:
   ```bash
   git add .
   git commit -m "feat: add new prompt optimization algorithm"
   git commit -m "fix: resolve issue with template loading"
   git commit -m "docs: update API documentation"
   ```

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation only changes
- `style:` - Changes that do not affect the meaning of the code
- `refactor:` - A code change that neither fixes a bug nor adds a feature
- `test:` - Adding missing tests or correcting existing tests
- `chore:` - Changes to the build process or auxiliary tools

## Submitting a Pull Request

### Before Submitting

1. **Ensure your branch is up to date**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Push your changes**
   ```bash
   git push origin your-feature-branch
   ```

### Creating the Pull Request

1. **Navigate to the original repository** on GitHub
2. **Click "New Pull Request"**
3. **Select your branch** from the "compare" dropdown
4. **Fill out the PR template** with the following information:

#### Pull Request Template

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests that you ran to verify your changes.

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### After Submitting

1. **Wait for review** - Maintainers will review your PR
2. **Address feedback** - Make requested changes if needed
3. **Keep your PR updated** - Rebase if the main branch has new commits

## Code Style Guidelines

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### React Components
- Use functional components with hooks
- Follow the existing component structure
- Use proper TypeScript typing for props

### CSS/Styling
- Use TailwindCSS utility classes
- Follow the existing design system
- Ensure responsive design

## Testing

- Write tests for new features
- Ensure existing tests pass
- Test across different browsers and devices
- Test both web and desktop applications

## Documentation

- Update README.md if needed
- Add JSDoc comments for new functions
- Update API documentation for new endpoints
- Include examples for new features

## Getting Help

If you need help or have questions:

1. **Check existing issues and discussions**
2. **Create a new issue** for bugs or feature requests
3. **Start a discussion** for general questions
4. **Contact maintainers** through GitHub

## Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project, you agree to abide by its terms.

## Recognition

Contributors will be recognized in the project's README.md and release notes.

Thank you for contributing to Prompt Booster! 🚀