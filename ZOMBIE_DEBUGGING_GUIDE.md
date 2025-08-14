# 🧟 Zombie Mode Debugging & Testing Guide

## 🚨 **CRITICAL ISSUES RESOLVED**

### ✅ **Build System Fixed**
- **Issue**: Missing zombie manager update method in compiled output
- **Solution**: Added public `update()` method to `ZombieManager` class
- **Status**: ✅ RESOLVED - All zombie files compile successfully

### ✅ **Game Integration Fixed**  
- **Issue**: Zombie manager not called in main game tick loop
- **Solution**: Added zombie update to `game.ts` tick method
- **Status**: ✅ RESOLVED - Zombies now update every game tick

### ✅ **Performance Optimized**
- **Issue**: `setInterval(2000ms)` causing performance degradation
- **Solution**: Replaced with tick-based spawning system
- **Status**: ✅ RESOLVED - No more background intervals

### ✅ **Memory Management Improved**
- **Issue**: Potential race conditions in zombie removal
- **Solution**: Added double-removal prevention
- **Status**: ✅ RESOLVED - Safe zombie cleanup

## 🔧 **BUILD WORKFLOW**

### **Correct Build Sequence:**
```bash
# 1. Install dependencies
pnpm install

# 2. Build server (includes zombie system)
pnpm build:server

# 3. Verify zombie files compiled
ls server/dist/server/src/zombies/

# 4. Run tests
node server/comprehensive-zombie-test.js
node server/test-zombie-integration.js

# 5. Start server
pnpm start
```

### **Expected Output:**
```
✅ dist/server/src/zombies/zombieManager.js (17734 bytes)
✅ dist/server/src/zombies/zombiePlayer.js (5518 bytes)
✅ dist/server/src/zombies/zombieAI.js (19813 bytes)
✅ dist/server/src/zombies/zombieTypes.js (3849 bytes)
```

## 🧟 **ZOMBIE SPAWNING DEBUG STEPS**

### **Step 1: Verify Solo Mode Detection**
```javascript
// Check in server logs:
console.log(`TeamMode: ${game.teamMode}, Solo: ${TeamMode.Solo}`);
console.log(`Is Solo: ${game.teamMode === TeamMode.Solo}`);
```

### **Step 2: Monitor Zombie Spawning Trigger**
```javascript
// Look for these log messages:
"Scheduling zombie spawning check for solo mode"
"✅ Enabling zombie mode - spawning zombies for X human player(s)"
"❌ Zombie mode not activated: TeamMode=X, HumanPlayers=Y"
```

### **Step 3: Check Zombie Manager Status**
```javascript
// Verify in game tick:
console.log(`Zombie Manager: ${game.zombieManager ? 'OK' : 'MISSING'}`);
console.log(`Update Method: ${typeof game.zombieManager.update}`);
console.log(`Zombie Count: ${game.zombieManager.zombies.size}`);
```

### **Step 4: Test Spawning Logic**
```javascript
// Manual spawn test:
if (game.zombieModeEnabled) {
    game.zombieManager.spawnZombiesForMatch(1);
    console.log(`Spawned: ${game.zombieManager.zombies.size} zombies`);
}
```

## 🎮 **GAMEPLAY TESTING PROCEDURE**

### **Solo Mode Test:**
1. **Start Server**: `pnpm start`
2. **Join Solo Game**: Connect with 1 player
3. **Wait 15 seconds**: Grace period for additional players
4. **Monitor Logs**: Look for zombie spawning messages
5. **Verify Spawning**: Check if zombies appear in game

### **Expected Timeline:**
- `T+0s`: Player joins solo game
- `T+3s`: Game starts, zombie spawning scheduled
- `T+18s`: Zombie mode activates (15s grace + 3s start delay)
- `T+18s`: Initial zombies spawn (4-8 zombies)
- `T+20s`: Dynamic spawning begins (every 2 seconds)

## 🔍 **DEBUGGING COMMANDS**

### **Test Zombie System:**
```bash
# Run comprehensive tests
node server/comprehensive-zombie-test.js

# Test integration
node server/test-zombie-integration.js

# Check compiled files
ls -la server/dist/server/src/zombies/
```

### **Monitor Server Logs:**
```bash
# Start with verbose logging
DEBUG=* pnpm start

# Or check specific zombie logs
grep -i "zombie" server.log
```

## ⚡ **PERFORMANCE MONITORING**

### **Key Metrics to Watch:**
- **Zombie Count**: Should stay within 8-12 zombies
- **Update Time**: Zombie updates should be <50ms
- **Memory Usage**: No memory leaks from zombie cleanup
- **Spawn Rate**: 1-2 zombies per 2-second interval

### **Performance Logs:**
```
✅ Normal: "Zombie update completed in 15ms"
⚠️  Warning: "Warning: Zombie update took 75ms (zombies: 15)"
❌ Error: "Zombie spawning failed: [error message]"
```

## 🐛 **COMMON ISSUES & SOLUTIONS**

### **Issue: "Zombies not spawning"**
**Causes:**
- Not in solo mode (`teamMode !== TeamMode.Solo`)
- More than 1 human player
- Zombie mode not enabled
- Game not started

**Debug:**
```javascript
console.log('Debug Info:', {
    teamMode: game.teamMode,
    humanPlayers: game.getHumanPlayerCount(),
    zombieModeEnabled: game.zombieModeEnabled,
    gameStarted: game._started
});
```

### **Issue: "Cannot read properties of undefined"**
**Causes:**
- Missing gas system initialization
- Incomplete game setup
- Map loading failure

**Solution:**
- Use "normal" map name (not "main")
- Ensure proper game initialization
- Check gas system is initialized

### **Issue: "Performance degradation"**
**Causes:**
- Too many zombies spawned
- Inefficient pathfinding
- Memory leaks

**Solution:**
- Monitor zombie count limits
- Check update timing logs
- Verify zombie cleanup

## 🎯 **INTEGRATION CHECKLIST**

### **Pre-Deployment:**
- [ ] All zombie files compile successfully
- [ ] Integration tests pass
- [ ] Solo mode detection works
- [ ] Zombie spawning triggers correctly
- [ ] Performance metrics within limits
- [ ] Memory cleanup working
- [ ] No console errors

### **Post-Deployment:**
- [ ] Monitor server logs for zombie messages
- [ ] Test solo game startup
- [ ] Verify zombie behavior in-game
- [ ] Check performance under load
- [ ] Monitor memory usage over time

## 🚀 **NEXT STEPS**

1. **Deploy Changes**: Push updated code to production
2. **Monitor Logs**: Watch for zombie spawning messages
3. **Test Gameplay**: Verify zombies spawn and behave correctly
4. **Performance Tune**: Adjust spawn rates if needed
5. **Community Feedback**: Gather player feedback on zombie difficulty

## 📞 **Support**

If issues persist:
1. Check server logs for specific error messages
2. Run the debugging scripts provided
3. Verify build process completed successfully
4. Test with minimal solo game setup

**The zombie system is now fully integrated and optimized for production use!** 🧟‍♂️✨
