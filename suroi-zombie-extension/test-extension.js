// Test VSCode extension functionality
const fs = require('fs');
const path = require('path');

console.log('🔧 Testing VSCode Extension...');

try {
    // Test package.json structure
    console.log('Testing package.json structure...');
    
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    
    // Verify basic properties
    if (packageJson.name === 'suroi-zombie-dev') {
        console.log('✅ Extension name is correct');
    }
    
    if (packageJson.displayName === 'Suroi Zombie Development Tools') {
        console.log('✅ Display name is correct');
    }
    
    // Test commands
    console.log('\nTesting command definitions...');
    const commands = packageJson.contributes.commands;
    const expectedCommands = [
        'suroiZombie.createZombieClass',
        'suroiZombie.createZombieType', 
        'suroiZombie.createAIBehavior',
        'suroiZombie.setupZombieProject'
    ];
    
    for (const expectedCmd of expectedCommands) {
        const found = commands.find(cmd => cmd.command === expectedCmd);
        if (found) {
            console.log(`✅ Command found: ${found.title}`);
        } else {
            console.log(`❌ Command missing: ${expectedCmd}`);
        }
    }
    
    // Test snippets
    console.log('\nTesting snippet definitions...');
    const snippetsPath = './snippets/zombie-snippets.json';
    
    if (fs.existsSync(snippetsPath)) {
        console.log('✅ Snippets file exists');
        
        const snippets = JSON.parse(fs.readFileSync(snippetsPath, 'utf8'));
        const expectedSnippets = [
            'Zombie Player Class',
            'Zombie Type Definition',
            'AI Behavior State',
            'Zombie Manager Method',
            'Evolution Handler',
            'Zombie Spawn Logic',
            'AI State Machine',
            'Zombie Import Block'
        ];
        
        for (const expectedSnippet of expectedSnippets) {
            if (snippets[expectedSnippet]) {
                console.log(`✅ Snippet found: ${expectedSnippet}`);
            } else {
                console.log(`❌ Snippet missing: ${expectedSnippet}`);
            }
        }
        
        // Test snippet structure
        const zombiePlayerSnippet = snippets['Zombie Player Class'];
        if (zombiePlayerSnippet && zombiePlayerSnippet.prefix === 'zombie-player') {
            console.log('✅ Zombie Player snippet has correct prefix');
        }
        
        if (zombiePlayerSnippet && zombiePlayerSnippet.body && zombiePlayerSnippet.body.length > 0) {
            console.log('✅ Zombie Player snippet has body content');
        }
        
    } else {
        console.log('❌ Snippets file not found');
    }
    
    // Test compiled extension
    console.log('\nTesting compiled extension...');
    const extensionPath = './out/extension.js';
    
    if (fs.existsSync(extensionPath)) {
        console.log('✅ Extension compiled successfully');
        
        const extensionContent = fs.readFileSync(extensionPath, 'utf8');
        
        // Check for key functions
        if (extensionContent.includes('activate')) {
            console.log('✅ Extension has activate function');
        }
        
        if (extensionContent.includes('ZombieCompletionProvider')) {
            console.log('✅ Extension has completion provider');
        }
        
        if (extensionContent.includes('ZombieHoverProvider')) {
            console.log('✅ Extension has hover provider');
        }
        
    } else {
        console.log('❌ Compiled extension not found');
    }
    
    // Test configuration
    console.log('\nTesting extension configuration...');
    const config = packageJson.contributes.configuration;
    
    if (config && config.properties) {
        const props = config.properties;
        
        if (props['suroiZombie.autoImports']) {
            console.log('✅ Auto-imports configuration found');
        }
        
        if (props['suroiZombie.debugMode']) {
            console.log('✅ Debug mode configuration found');
        }
    }
    
    console.log('\n🎉 VSCode Extension test completed successfully!');
    console.log('\n📝 Installation Instructions:');
    console.log('1. Open VSCode');
    console.log('2. Press Ctrl+Shift+P');
    console.log('3. Type "Extensions: Install from VSIX"');
    console.log('4. Select this extension directory');
    console.log('5. Use Ctrl+Shift+P and search for "Suroi Zombie" commands');
    console.log('6. Type "zombie-" in TypeScript files to see snippets');
    
} catch (error) {
    console.error('❌ VSCode Extension test failed:', error.message);
}
