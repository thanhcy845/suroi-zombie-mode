# 🚀 Suroi Zombie Mode Setup Guide

This guide will help you set up and run the Suroi Zombie Mode project on your local machine.

## 📋 Prerequisites

### Required Software
- **Node.js 18+**: [Download from nodejs.org](https://nodejs.org/)
- **pnpm**: Package manager for Node.js
- **Git**: Version control system
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Network**: Internet connection for initial setup
- **OS**: Windows 10+, macOS 10.15+, or Linux

## 🛠️ Installation Steps

### Step 1: Install Node.js and pnpm

#### Windows
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the setup wizard
3. Open Command Prompt or PowerShell
4. Install pnpm globally:
```bash
npm install -g pnpm
```

#### macOS
```bash
# Using Homebrew (recommended)
brew install node
npm install -g pnpm

# Or using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
npm install -g pnpm
```

#### Linux
```bash
# Using package manager (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm

# Or using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
npm install -g pnpm
```

### Step 2: Clone the Repository

```bash
# Clone the project
git clone https://github.com/yourusername/suroi-zombie-mode.git

# Navigate to project directory
cd suroi-zombie-mode
```

### Step 3: Install Dependencies

```bash
# Install all project dependencies
pnpm install
```

This will install dependencies for:
- Server components
- Client components  
- Common shared code
- Development tools

### Step 4: Build the Project

```bash
# Build everything (recommended for first setup)
pnpm build

# Or build components separately
pnpm build:server  # Build game server
pnpm build:client  # Build web client
```

### Step 5: Configure the Server

```bash
# Copy example configuration (if config.json doesn't exist)
cp server/config.example.json config.json
```

Edit `config.json` if needed:
```json
{
    "hostname": "127.0.0.1",
    "port": 8000,
    "map": "normal",
    "teamMode": "solo",
    "maxPlayersPerGame": 80,
    "maxGames": 5
}
```

## 🎮 Running the Game

### Method 1: Development Mode (Recommended for Development)

```bash
# Start both server and client in development mode
pnpm dev

# Or start them separately in different terminals
pnpm dev:server  # Terminal 1
pnpm dev:client  # Terminal 2
```

### Method 2: Production Mode (Recommended for Testing)

```bash
# Terminal 1: Start the game server
node server/dist/server/src/server.js

# Terminal 2: Start the client server
cd client/dist && npx sirv . --port 3000 --host 0.0.0.0
```

### Method 3: Using npm scripts

```bash
# Build and start production server
pnpm start
```

## 🧟 Testing Zombie Mode

### Step 1: Access the Game
1. Open your browser
2. Navigate to `http://localhost:3000`
3. Wait for the game to load

### Step 2: Join Solo Mode
1. Click **"Chơi đơn"** (Solo mode button)
2. Enter your player name (optional)
3. Click **"Tải trọng"** (Join game button)

### Step 3: Activate Zombie Mode
1. Wait for the game to start
2. **Important**: Wait 15 seconds for zombies to spawn
3. Zombies will automatically appear if you're the only player

### Step 4: Verify Zombie System
Check the server console for messages like:
```
[ZOMBIE] Enabling zombie mode - spawning zombies for 1 human player(s)
[ZOMBIE] Spawned zombie at position (x, y)
[ZOMBIE AI] Moving towards player at (x, y)
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Server Won't Start
**Error**: `Cannot destructure property 'rotation' of 'config_1.Config.teamMode'`
**Solution**: Ensure `config.json` exists in the root directory
```bash
cp server/config.json config.json
```

#### Port Already in Use
**Error**: `EADDRINUSE: address already in use :::8000`
**Solution**: Kill existing processes or change port
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9
```

#### Client Connection Failed
**Error**: Cannot connect to server
**Solution**: 
1. Verify server is running on port 8000
2. Check firewall settings
3. Try `http://127.0.0.1:3000` instead of `localhost`

#### Zombies Not Spawning
**Possible Causes**:
- Not in solo mode
- Multiple players in game
- Haven't waited 15 seconds
- Server error

**Solution**:
1. Ensure you're in solo mode
2. Wait full 15 seconds after game start
3. Check server console for error messages

#### Build Errors
**Error**: TypeScript compilation errors
**Solution**:
```bash
# Clean build cache
rm -rf server/dist client/dist
pnpm build
```

### Debug Mode

Enable detailed logging by checking server console output:
```bash
# Run with debug output
DEBUG=* node server/dist/server/src/server.js
```

### Testing Tools

```bash
# Test zombie system
cd server && node zombie-system-test.js

# Test zombie AI
cd server && node test-zombie.js

# Run diagnostics
cd server && node zombie-diagnostics.js
```

## 🔄 Development Workflow

### Making Changes

1. **Edit Source Code**: Modify files in `src/` directories
2. **Rebuild**: Run `pnpm build` or use dev mode for auto-rebuild
3. **Test**: Restart servers and test changes
4. **Debug**: Use console logs and debug tools

### Hot Reload (Development Mode)

```bash
# Auto-rebuild on file changes
pnpm dev
```

### Production Testing

```bash
# Build and test production version
pnpm build
pnpm start
```

## 📊 Performance Monitoring

### Server Performance
- Monitor CPU usage during zombie spawning
- Check memory usage with multiple zombies
- Verify network bandwidth usage

### Client Performance
- Check FPS during zombie encounters
- Monitor browser memory usage
- Test on different devices/browsers

## 🆘 Getting Help

### Resources
- **Documentation**: Check `docs/` folder
- **Source Code**: Review `server/src/zombies/` for implementation
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions

### Debug Information to Include
When reporting issues, include:
- Operating system and version
- Node.js version (`node --version`)
- pnpm version (`pnpm --version`)
- Error messages from console
- Steps to reproduce the issue

---

**Ready to start developing? Follow this guide step by step and you'll have the zombie mode running in no time!** 🧟‍♂️
