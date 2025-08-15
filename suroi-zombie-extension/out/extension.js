"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
function activate(context) {
    console.log("Suroi Zombie Development extension is now active!");
    // Register commands
    const createZombieClass = vscode.commands.registerCommand("suroiZombie.createZombieClass", async() => {
        const zombieName = await vscode.window.showInputBox({
            prompt: "Enter zombie class name (e.g., FastRunner)",
            placeHolder: "ZombieName"
        });
        if (!zombieName) { return; }
        const zombieType = await vscode.window.showInputBox({
            prompt: "Enter zombie type ID (e.g., fast_runner)",
            placeHolder: "zombie_type_id"
        });
        if (!zombieType) { return; }
        const template = generateZombieClassTemplate(zombieName, zombieType);
        insertAtCursor(template);
    });
    const createZombieType = vscode.commands.registerCommand("suroiZombie.createZombieType", async() => {
        const typeName = await vscode.window.showInputBox({
            prompt: "Enter zombie type name",
            placeHolder: "Super Zombie"
        });
        if (!typeName) { return; }
        const typeId = await vscode.window.showInputBox({
            prompt: "Enter zombie type ID",
            placeHolder: "super_zombie"
        });
        if (!typeId) { return; }
        const template = generateZombieTypeTemplate(typeName, typeId);
        insertAtCursor(template);
    });
    const createAIBehavior = vscode.commands.registerCommand("suroiZombie.createAIBehavior", async() => {
        const behaviorName = await vscode.window.showInputBox({
            prompt: "Enter AI behavior name",
            placeHolder: "Aggressive"
        });
        if (!behaviorName) { return; }
        const template = generateAIBehaviorTemplate(behaviorName);
        insertAtCursor(template);
    });
    const setupProject = vscode.commands.registerCommand("suroiZombie.setupZombieProject", async() => {
        vscode.window.showInformationMessage("Zombie development environment is ready! Use the zombie snippets to get started.");
    });
    // Register completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider(["typescript", "javascript"], new ZombieCompletionProvider(), ".");
    // Register hover provider
    const hoverProvider = vscode.languages.registerHoverProvider(["typescript", "javascript"], new ZombieHoverProvider());
    context.subscriptions.push(createZombieClass, createZombieType, createAIBehavior, setupProject, completionProvider, hoverProvider);
}
exports.activate = activate;
class ZombieCompletionProvider {
    provideCompletionItems(document, position) {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        if (linePrefix.includes("ZombieTypes.")) {
            return [
                new vscode.CompletionItem("basic_zombie", vscode.CompletionItemKind.Constant),
                new vscode.CompletionItem("fast_runner", vscode.CompletionItemKind.Constant),
                new vscode.CompletionItem("tank_zombie", vscode.CompletionItemKind.Constant)
            ];
        }
        if (linePrefix.includes("ZombieAIState.")) {
            return [
                new vscode.CompletionItem("Idle", vscode.CompletionItemKind.Enum),
                new vscode.CompletionItem("Wandering", vscode.CompletionItemKind.Enum),
                new vscode.CompletionItem("Hunting", vscode.CompletionItemKind.Enum),
                new vscode.CompletionItem("Attacking", vscode.CompletionItemKind.Enum),
                new vscode.CompletionItem("Fleeing", vscode.CompletionItemKind.Enum),
                new vscode.CompletionItem("Grouping", vscode.CompletionItemKind.Enum)
            ];
        }
        return [];
    }
}
class ZombieHoverProvider {
    provideHover(document, position) {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);
        const zombieDocumentation = {
            ZombiePlayer: "Base class for AI-controlled zombie players with pathfinding and combat behavior",
            ZombieManager: "Manages zombie spawning, evolution, and lifecycle in the game",
            ZombieAI: "AI system that controls zombie behavior, movement, and decision making",
            basic_zombie: "Standard zombie type with balanced stats and pack behavior",
            fast_runner: "Fast, agile zombie with high speed but lower health",
            tank_zombie: "Heavy zombie with high health and damage but slower movement"
        };
        if (zombieDocumentation[word]) {
            return new vscode.Hover(zombieDocumentation[word]);
        }
        return undefined;
    }
}
function generateZombieClassTemplate(name, type) {
    return `import { Game } from "../game";
import { ZombiePlayer } from "./zombiePlayer";
import { ZombieTypes } from "./zombieTypes";
import { Vec, type Vector } from "@common/utils/vector";

export class ${name}Zombie extends ZombiePlayer {
    constructor(game: Game, position: Vector) {
        super(game, ZombieTypes.fromString("${type}"), position);
    }

    override update(): void {
        if (this.dead) return;
        
        // Custom ${name} behavior
        
        super.update();
    }

    override zombieAttack(target: Player): void {
        // Custom attack behavior for ${name}
        super.zombieAttack(target);
    }
}`;
}
function generateZombieTypeTemplate(name, id) {
    return `{
    idString: "${id}",
    name: "${name}",
    health: 100,
    speed: 1.0,
    damage: 25,
    attackRange: 2.5,
    detectionRange: 15,
    skin: "hazel_jumpsuit",
    evolutionLevel: 0,
    aggressionLevel: 0.6,
    packBehavior: true
}`;
}
function generateAIBehaviorTemplate(name) {
    return `private handle${name}State(): void {
    const nearestPlayer = this.findNearestPlayer();
    
    if (nearestPlayer && this.canDetectPlayer(nearestPlayer)) {
        // ${name} behavior logic
        this.setState(ZombieAIState.Hunting, nearestPlayer);
    } else {
        this.setState(ZombieAIState.Idle);
    }
}`;
}
async function insertAtCursor(text) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("No active editor");
        return;
    }
    await editor.edit(editBuilder => {
        editBuilder.insert(editor.selection.active, text);
    });
}
function deactivate() { }
exports.deactivate = deactivate;
// # sourceMappingURL=extension.js.map
