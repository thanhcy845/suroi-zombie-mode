# 🤝 Contributing to Suroi Zombie Mode

Thank you for your interest in contributing to the Suroi Zombie Mode project! This guide will help you get started with contributing to this independent educational project.

## 📋 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Areas for Contribution](#areas-for-contribution)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)

## 📜 Code of Conduct

### Our Pledge
We are committed to making participation in this project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Expected Behavior
- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites
Before contributing, ensure you have:
- Node.js 18+ installed
- pnpm package manager
- Git version control
- Basic understanding of TypeScript/JavaScript
- Familiarity with game development concepts

### First Steps
1. **Fork the Repository**: Click the "Fork" button on GitHub
2. **Clone Your Fork**: 
   ```bash
   git clone https://github.com/yourusername/suroi-zombie-mode.git
   cd suroi-zombie-mode
   ```
3. **Set Up Development Environment**: Follow the [Setup Guide](docs/SETUP_GUIDE.md)
4. **Create a Branch**: 
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠️ Development Setup

### Environment Configuration
```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Start development servers
pnpm dev
```

### Testing Your Setup
```bash
# Run zombie system tests
cd server && node zombie-system-test.js

# Test zombie AI
cd server && node test-zombie.js

# Run diagnostics
cd server && node zombie-diagnostics.js
```

## 📝 Contributing Guidelines

### Types of Contributions

#### 🐛 Bug Reports
- Use the bug report template
- Include detailed reproduction steps
- Provide system information
- Include error logs and screenshots

#### ✨ Feature Requests
- Use the feature request template
- Explain the use case and benefits
- Consider implementation complexity
- Discuss with maintainers first for major features

#### 🔧 Code Contributions
- Follow coding standards
- Include tests for new features
- Update documentation
- Ensure backward compatibility

#### 📚 Documentation
- Improve existing documentation
- Add code comments
- Create tutorials and guides
- Fix typos and formatting

## 🔄 Pull Request Process

### Before Submitting
1. **Test Thoroughly**: Ensure your changes work correctly
2. **Run Tests**: Execute all test suites
3. **Update Documentation**: Reflect changes in relevant docs
4. **Check Code Style**: Follow project coding standards

### PR Submission
1. **Create Pull Request**: Use the PR template
2. **Descriptive Title**: Clearly describe the change
3. **Detailed Description**: Explain what, why, and how
4. **Link Issues**: Reference related issues
5. **Request Review**: Tag relevant maintainers

### PR Requirements
- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)
- [ ] Follows coding standards

## 🎯 Areas for Contribution

### 🧟 Zombie System Enhancements
- **New Zombie Types**: Create unique zombie variants
- **AI Improvements**: Enhance pathfinding and behavior
- **Performance Optimization**: Improve zombie system efficiency
- **Balancing**: Adjust zombie stats and spawn rates

### 🎮 Gameplay Features
- **Game Modes**: Add new survival challenges
- **Power-ups**: Implement temporary player abilities
- **Environmental Hazards**: Add map-based dangers
- **Scoring System**: Track and display survival statistics

### 🔧 Technical Improvements
- **Code Refactoring**: Improve code structure and readability
- **Performance Optimization**: Reduce memory usage and improve FPS
- **Network Optimization**: Improve client-server communication
- **Error Handling**: Add robust error recovery

### 🎨 UI/UX Enhancements
- **Zombie Mode UI**: Create dedicated interface elements
- **Visual Effects**: Add zombie-specific animations and effects
- **Sound Design**: Implement zombie audio cues
- **Accessibility**: Improve game accessibility features

### 📊 Analytics and Monitoring
- **Performance Metrics**: Add system monitoring
- **Gameplay Analytics**: Track player behavior and survival stats
- **Debug Tools**: Create development and testing utilities
- **Logging Improvements**: Enhance system logging

## 📏 Coding Standards

### TypeScript/JavaScript
```typescript
// Use descriptive variable names
const zombieSpawnInterval = 30000; // ✅ Good
const interval = 30000; // ❌ Avoid

// Add type annotations
function spawnZombie(position: Vector, type: ZombieType): ZombiePlayer {
    // Implementation
}

// Use meaningful comments
/**
 * Calculates optimal path from zombie to player using A* algorithm
 * @param start - Zombie's current position
 * @param target - Player's position
 * @param obstacles - Array of obstacles to avoid
 * @returns Array of waypoints representing the path
 */
function calculatePath(start: Vector, target: Vector, obstacles: Obstacle[]): Vector[] {
    // Implementation
}
```

### File Organization
```
server/src/zombies/
├── zombieManager.ts      # Main zombie management
├── zombiePlayer.ts       # Individual zombie logic
├── zombieAI.ts          # AI and pathfinding
├── zombieTypes.ts       # Type definitions
└── tests/               # Test files
    ├── zombieAI.test.ts
    └── zombieManager.test.ts
```

### Naming Conventions
- **Classes**: PascalCase (`ZombieManager`, `ZombiePlayer`)
- **Functions**: camelCase (`spawnZombie`, `calculatePath`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ZOMBIES`, `SPAWN_INTERVAL`)
- **Files**: camelCase (`zombieManager.ts`, `zombieAI.ts`)

## 🧪 Testing Guidelines

### Test Structure
```typescript
describe('ZombieAI', () => {
    describe('pathfinding', () => {
        it('should find optimal path to player', () => {
            // Arrange
            const zombie = new ZombiePlayer(/* params */);
            const player = new Player(/* params */);
            
            // Act
            const path = zombie.ai.findPathToTarget(player.position);
            
            // Assert
            expect(path).toBeDefined();
            expect(path.length).toBeGreaterThan(0);
        });
    });
});
```

### Test Categories
- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test component interactions
- **Performance Tests**: Verify system performance
- **End-to-End Tests**: Test complete gameplay scenarios

### Running Tests
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test zombieAI.test.ts

# Run tests with coverage
pnpm test:coverage
```

## 📋 Commit Guidelines

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
feat(zombie): add fast zombie type with increased speed
fix(ai): resolve pathfinding issue with diagonal movement
docs(setup): update installation instructions for Windows
test(zombie): add unit tests for zombie spawning logic
```

## 🏷️ Issue Labels

### Priority Labels
- `priority: high` - Critical issues requiring immediate attention
- `priority: medium` - Important issues for next release
- `priority: low` - Nice-to-have improvements

### Type Labels
- `bug` - Something isn't working
- `enhancement` - New feature or improvement
- `documentation` - Documentation improvements
- `question` - Further information requested

### Component Labels
- `zombie-ai` - Zombie artificial intelligence
- `zombie-spawning` - Zombie spawn system
- `performance` - Performance related
- `ui/ux` - User interface and experience

## 🆘 Getting Help

### Resources
- **Documentation**: Check the `docs/` folder
- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Search existing issues before creating new ones
- **Code Review**: Request feedback on your contributions

### Contact
- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For general questions and ideas
- **Code Reviews**: Tag maintainers in pull requests

## 🙏 Recognition

Contributors will be recognized in:
- **README.md**: Listed in the contributors section
- **CHANGELOG.md**: Credited for their contributions
- **Release Notes**: Mentioned in version releases

Thank you for contributing to Suroi Zombie Mode! Your efforts help make this project better for everyone. 🧟‍♂️🎮
