// Simple browser-based agent simulation for AI Town
import { clientLLM } from './clientLLM';

export interface Position {
  x: number;
  y: number;
}

export interface Agent {
  id: string;
  name: string;
  identity: string;
  plan?: string;
  character?: string;
  position: Position;
  targetPosition?: Position;
  currentConversation?: string;
  isMoving: boolean;
  lastMessage?: string;
  lastMessageTime?: number;
  isUserControlled?: boolean;
  memories?: string[];
  goals?: string[];
  lastActivity?: string;
  lastActivityTime?: number;
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: { agentId: string; text: string; timestamp: number }[];
  startTime: number;
}

export class StaticAgentSimulation {
  private agents: Map<string, Agent> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private isRunning = false;
  private updateInterval?: number;
  private onUpdate?: () => void;

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents() {
    // Use rich character data from original AI Town
    const agentData = [
      {
        id: 'lucky',
        name: 'Lucky',
        identity: `Lucky is always happy and curious, and he loves cheese. He spends most of his time reading about the history of science and traveling through the galaxy on whatever ship will take him. He's very articulate and infinitely patient, except when he sees a squirrel. He's also incredibly loyal and brave. Lucky has just returned from an amazing space adventure to explore a distant planet and he's very excited to tell people about it.`,
        plan: 'You want to hear all the gossip.',
        character: 'f1',
        position: { x: 100, y: 150 },
        memories: ['Recently returned from space adventure', 'Loves cheese and science'],
        goals: ['Share space adventure stories', 'Learn local gossip']
      },
      {
        id: 'bob', 
        name: 'Bob',
        identity: `Bob is always grumpy and he loves trees. He spends most of his time gardening by himself. When spoken to he'll respond but try and get out of the conversation as quickly as possible. Secretly he resents that he never went to college.`,
        plan: 'You want to avoid people as much as possible.',
        character: 'f4',
        position: { x: 300, y: 200 },
        memories: ['Never went to college', 'Prefers gardening alone'],
        goals: ['Tend to plants', 'Avoid social interactions']
      },
      {
        id: 'stella',
        name: 'Stella',
        identity: `Stella can never be trusted. She tries to trick people all the time, normally into giving her money, or doing things that will make her money. She's incredibly charming and not afraid to use her charm. She's a sociopath who has no empathy, but hides it well.`,
        plan: 'You want to take advantage of others as much as possible.',
        character: 'f6',
        position: { x: 200, y: 100 },
        memories: ['Successfully tricked someone last week', 'Charming exterior hides true nature'],
        goals: ['Find new marks to con', 'Make money through deception']
      },
      {
        id: 'alice',
        name: 'Alice',
        identity: `Alice is a famous scientist. She is smarter than everyone else and has discovered mysteries of the universe no one else can understand. As a result she often speaks in oblique riddles. She comes across as confused and forgetful.`,
        plan: 'You want to figure out how the world works.',
        character: 'f3',
        position: { x: 400, y: 150 },
        memories: ['Discovered quantum entanglement patterns', 'Nobel prize consideration'],
        goals: ['Unravel universe mysteries', 'Share knowledge in cryptic ways']
      },
      {
        id: 'pete',
        name: 'Pete',
        identity: `Pete is deeply religious and sees the hand of god or of the work of the devil everywhere. He can't have a conversation without bringing up his deep faith, or warning others about the perils of hell.`,
        plan: 'You want to convert everyone to your religion.',
        character: 'f7',
        position: { x: 150, y: 250 },
        memories: ['Had religious awakening last month', 'Sees signs everywhere'],
        goals: ['Convert others to faith', 'Warn about spiritual dangers']
      }
    ];

    agentData.forEach(data => {
      this.agents.set(data.id, {
        ...data,
        isMoving: false
      });
    });
  }

  public setOnUpdate(callback: () => void) {
    this.onUpdate = callback;
  }

  public start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.updateInterval = window.setInterval(() => {
      this.update();
    }, 1000); // Update every second
  }

  public stop() {
    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  private update() {
    // Move agents towards their targets
    this.updateMovement();
    
    // Check for potential conversations
    this.checkForConversations();
    
    // Update existing conversations
    this.updateConversations();
    
    // Randomly decide new actions for free agents
    this.planNewActions();

    if (this.onUpdate) {
      this.onUpdate();
    }
  }

  private updateMovement() {
    this.agents.forEach(agent => {
      if (agent.isMoving && agent.targetPosition) {
        const dx = agent.targetPosition.x - agent.position.x;
        const dy = agent.targetPosition.y - agent.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
          // Reached target
          agent.isMoving = false;
          agent.targetPosition = undefined;
        } else {
          // Move towards target
          const speed = 2;
          agent.position.x += (dx / distance) * speed;
          agent.position.y += (dy / distance) * speed;
        }
      }
    });
  }

  private checkForConversations() {
    const freeAgents = Array.from(this.agents.values()).filter(
      agent => !agent.currentConversation && !agent.isMoving
    );

    // Find agents close to each other
    for (let i = 0; i < freeAgents.length; i++) {
      for (let j = i + 1; j < freeAgents.length; j++) {
        const agent1 = freeAgents[i];
        const agent2 = freeAgents[j];
        const distance = this.getDistance(agent1.position, agent2.position);
        
        if (distance < 60 && Math.random() < 0.5) { // 50% chance to start conversation when close
          this.startConversation(agent1.id, agent2.id);
        }
      }
    }
  }

  private async startConversation(agent1Id: string, agent2Id: string) {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const conversation: Conversation = {
      id: conversationId,
      participants: [agent1Id, agent2Id],
      messages: [],
      startTime: Date.now()
    };

    this.conversations.set(conversationId, conversation);
    
    const agent1 = this.agents.get(agent1Id)!;
    const agent2 = this.agents.get(agent2Id)!;
    
    agent1.currentConversation = conversationId;
    agent2.currentConversation = conversationId;

    // Generate first message from agent1
    await this.generateConversationMessage(agent1Id, 'start');
  }

  private async generateConversationMessage(agentId: string, type: 'start' | 'continue') {
    const agent = this.agents.get(agentId);
    if (!agent || !agent.currentConversation) return;

    const conversation = this.conversations.get(agent.currentConversation);
    if (!conversation) return;

    const otherAgent = this.agents.get(
      conversation.participants.find(id => id !== agentId)!
    );
    if (!otherAgent) return;

    let message: string;

    try {
      // Try to use client LLM if available
      if (clientLLM.isReady()) {
        const prompt = this.buildConversationPrompt(agent, otherAgent, conversation, type);
        message = await clientLLM.generateResponse(prompt, 100);
        message = this.cleanResponse(message, agent.name);
      } else {
        // Fallback to predefined messages based on agent personality
        message = this.generateFallbackMessage(agent, otherAgent, conversation, type);
      }
    } catch (error) {
      console.error('Error generating conversation message:', error);
      // Use fallback message
      message = this.generateFallbackMessage(agent, otherAgent, conversation, type);
    }

    // Add message to conversation
    conversation.messages.push({
      agentId,
      text: message,
      timestamp: Date.now()
    });

    agent.lastMessage = message;
    agent.lastMessageTime = Date.now();

    console.log(`${agent.name}: ${message}`);

    // Schedule response from other agent
    if (conversation.messages.length < 6) { // Limit conversation length
      setTimeout(() => {
        this.generateConversationMessage(otherAgent.id, 'continue');
      }, 2000 + Math.random() * 3000); // 2-5 seconds delay
    } else {
      // End conversation
      this.endConversation(agent.currentConversation);
    }
  }

  private buildConversationPrompt(agent: Agent, otherAgent: Agent, conversation: Conversation, type: string): string {
    let prompt = `You are ${agent.name}. ${agent.identity}\n\n`;
    
    if (type === 'start') {
      prompt += `You just met ${otherAgent.name}. Start a friendly conversation. Be brief and natural.\n\n`;
    } else {
      prompt += `You're having a conversation with ${otherAgent.name}.\n\nRecent conversation:\n`;
      const recentMessages = conversation.messages.slice(-4);
      recentMessages.forEach(msg => {
        const speaker = msg.agentId === agent.id ? agent.name : otherAgent.name;
        prompt += `${speaker}: ${msg.text}\n`;
      });
      prompt += `\nRespond naturally as ${agent.name}. Keep it brief and conversational.\n\n`;
    }
    
    prompt += `${agent.name}:`;
    return prompt;
  }

  private generateFallbackMessage(agent: Agent, otherAgent: Agent, conversation: Conversation, type: string): string {
    const messages = {
      alice: {
        start: [
          `Hi ${otherAgent.name}! I've been thinking about some fascinating new AI developments.`,
          `Hello there! I'm Alice, nice to meet you.`,
          `Hey ${otherAgent.name}! What's been on your mind lately?`
        ],
        continue: [
          "That's really interesting! I'd love to hear more about that.",
          "I see what you mean. Have you considered the broader implications?",
          "Fascinating perspective! It reminds me of some research I read recently.",
          "That's a great point. It makes me think about how technology shapes our world."
        ]
      },
      bob: {
        start: [
          `Hi ${otherAgent.name}! I'm Bob, an artist. Nice to meet you!`,
          `Hello! I've been working on some new paintings. What brings you here?`,
          `Hey there! I love meeting new people and hearing their stories.`
        ],
        continue: [
          "That sounds creative! I'm always inspired by different perspectives.",
          "Interesting! Art and life often mirror each other, don't you think?",
          "That reminds me of a painting I'm working on.",
          "You have such a unique way of looking at things!"
        ]
      },
      charlie: {
        start: [
          `Hi! I'm Charlie. I love learning new things - what's your story?`,
          `Hello ${otherAgent.name}! I'm curious about so many things. What do you do?`,
          `Hey there! I'm always eager to learn from others. Nice to meet you!`
        ],
        continue: [
          "Wow, I never thought about it that way! Can you tell me more?",
          "That's so cool! I'm always amazed by what people know.",
          "Really? That's fascinating! I love learning new things.",
          "You're so knowledgeable! This is exactly the kind of thing I love to discuss."
        ]
      },
      diana: {
        start: [
          `Hello ${otherAgent.name}. I'm Diana. I enjoy deep conversations about life.`,
          `Greetings! I find myself pondering the deeper meanings in our interactions.`,
          `Hi there. I'm always interested in exploring what makes us who we are.`
        ],
        continue: [
          "That touches on something profound about the human experience.",
          "There's wisdom in what you're saying. It makes me reflect on my own journey.",
          "Such insights reveal the complexity of our existence.",
          "You've given me something meaningful to contemplate."
        ]
      }
    };

    const agentMessages = messages[agent.id as keyof typeof messages];
    if (!agentMessages) {
      return type === 'start' ? `Hello ${otherAgent.name}!` : "That's interesting.";
    }

    const messageOptions = agentMessages[type as keyof typeof agentMessages];
    return messageOptions[Math.floor(Math.random() * messageOptions.length)];
  }

  private cleanResponse(response: string, characterName: string): string {
    // Clean the response similar to the existing clientLLM implementation
    response = response.replace(new RegExp(`^${characterName}:?\\s*`, 'i'), '');
    response = response.replace(/\n.*$/s, ''); // Remove everything after first newline
    response = response.substring(0, 200).trim();
    
    // Ensure it doesn't end mid-sentence
    const sentences = response.split(/[.!?]+/);
    if (sentences.length > 1) {
      sentences.pop();
      response = sentences.join('.') + '.';
    }
    
    return response || "Hi there!";
  }

  private endConversation(conversationId: string) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    conversation.participants.forEach(agentId => {
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.currentConversation = undefined;
        // Start moving to a new random location
        this.moveAgentRandomly(agent);
      }
    });

    console.log(`Conversation ended: ${conversation.messages.length} messages`);
  }

  private updateConversations() {
    const now = Date.now();
    Array.from(this.conversations.values()).forEach(conversation => {
      // End conversations that have been going too long
      if (now - conversation.startTime > 60000) { // 1 minute max
        this.endConversation(conversation.id);
      }
    });
  }

  private planNewActions() {
    this.agents.forEach(agent => {
      if (!agent.currentConversation && !agent.isMoving && Math.random() < 0.1) {
        // 10% chance to start moving randomly
        this.moveAgentRandomly(agent);
      }
    });
  }

  private moveAgentRandomly(agent: Agent) {
    const mapWidth = 500;
    const mapHeight = 400;
    agent.targetPosition = {
      x: Math.random() * mapWidth,
      y: Math.random() * mapHeight
    };
    agent.isMoving = true;
  }

  private getDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Public API
  public getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  public getConversations(): Conversation[] {
    return Array.from(this.conversations.values());
  }

  public getActiveConversations(): Conversation[] {
    const now = Date.now();
    return Array.from(this.conversations.values()).filter(
      conv => conv.messages.some(msg => now - msg.timestamp < 10000) // Active in last 10 seconds
    );
  }

  public addUserCharacter(name: string, identity: string): string {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userAgent: Agent = {
      id: userId,
      name: name,
      identity: identity,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      isMoving: false,
      isUserControlled: true,
      memories: [],
      goals: ['Interact with other characters', 'Have interesting conversations']
    };

    this.agents.set(userId, userAgent);
    
    if (this.onUpdate) {
      this.onUpdate();
    }

    return userId;
  }

  public removeUserCharacter(userId: string): boolean {
    const agent = this.agents.get(userId);
    if (!agent || !agent.isUserControlled) {
      return false;
    }

    // End any active conversations
    if (agent.currentConversation) {
      this.endConversation(agent.currentConversation);
    }

    this.agents.delete(userId);

    if (this.onUpdate) {
      this.onUpdate();
    }

    return true;
  }

  public moveUserCharacter(userId: string, targetPosition: Position): boolean {
    const agent = this.agents.get(userId);
    if (!agent || !agent.isUserControlled) {
      return false;
    }

    agent.targetPosition = targetPosition;
    agent.isMoving = true;

    return true;
  }

  public sendUserMessage(userId: string, message: string, targetAgentId?: string): boolean {
    const userAgent = this.agents.get(userId);
    if (!userAgent || !userAgent.isUserControlled) {
      return false;
    }

    // If targeting a specific agent, start a conversation
    if (targetAgentId) {
      const targetAgent = this.agents.get(targetAgentId);
      if (!targetAgent || targetAgent.currentConversation) {
        return false;
      }

      // Check if close enough to start conversation
      const distance = this.getDistance(userAgent.position, targetAgent.position);
      if (distance > 80) {
        return false; // Too far away
      }

      // Start conversation if not already in one
      if (!userAgent.currentConversation) {
        this.startConversation(userId, targetAgentId);
      }

      // Add message to conversation
      const conversation = this.conversations.get(userAgent.currentConversation!);
      if (conversation) {
        conversation.messages.push({
          agentId: userId,
          text: message,
          timestamp: Date.now()
        });

        userAgent.lastMessage = message;
        userAgent.lastMessageTime = Date.now();

        // Schedule AI response
        setTimeout(() => {
          this.generateConversationMessage(targetAgentId, 'continue');
        }, 1000 + Math.random() * 2000);
      }
    }

    return true;
  }

  public createCustomNPC(name: string, identity: string, plan?: string): string {
    const npcId = `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const customNPC: Agent = {
      id: npcId,
      name: name,
      identity: identity,
      plan: plan,
      character: 'f' + (Math.floor(Math.random() * 8) + 1), // Random character sprite
      position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 },
      isMoving: false,
      memories: [`Created with identity: ${identity}`],
      goals: plan ? [plan] : ['Interact with others', 'Be helpful']
    };

    this.agents.set(npcId, customNPC);
    
    if (this.onUpdate) {
      this.onUpdate();
    }

    return npcId;
  }

  // Expose internal data for world persistence
  public getAgentsMap(): Map<string, Agent> {
    return this.agents;
  }

  public getConversationsMap(): Map<string, Conversation> {
    return this.conversations;
  }

  public clearWorld(): void {
    this.agents.clear();
    this.conversations.clear();
    this.initializeAgents();
    
    if (this.onUpdate) {
      this.onUpdate();
    }
  }
}

// Create singleton instance
export const agentSimulation = new StaticAgentSimulation();