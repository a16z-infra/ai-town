import { pipeline, TextGenerationPipeline } from '@xenova/transformers';

// Client-side LLM service using Transformers.js
class ClientLLMService {
  private textGenerator: TextGenerationPipeline | null = null;
  private isLoading = false;

  async initialize() {
    if (this.textGenerator || this.isLoading) return;
    
    this.isLoading = true;
    try {
      // Use a smaller model that can run efficiently in the browser
      this.textGenerator = await pipeline('text-generation', 'Xenova/distilgpt2') as TextGenerationPipeline;
    } catch (error) {
      console.error('Failed to initialize client-side LLM:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async generateResponse(prompt: string, maxTokens: number = 100): Promise<string> {
    if (!this.textGenerator) {
      await this.initialize();
    }

    if (!this.textGenerator) {
      throw new Error('Failed to initialize text generator');
    }

    try {
      const response = await this.textGenerator(prompt, {
        max_new_tokens: maxTokens,
        temperature: 0.7,
        do_sample: true,
        top_p: 0.9,
        repetition_penalty: 1.1,
      }) as any;

      // Extract the generated text, removing the input prompt
      const fullText = Array.isArray(response) ? response[0].generated_text : response.generated_text;
      const generatedText = fullText.substring(prompt.length).trim();
      
      return generatedText;
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  async generateConversationMessage(
    characterName: string,
    identity: string,
    conversationHistory: string[],
    type: 'start' | 'continue' | 'leave',
    otherCharacterName?: string
  ): Promise<string> {
    let prompt = `You are ${characterName}. ${identity}\n\n`;
    
    if (type === 'start') {
      prompt += `You are starting a conversation with ${otherCharacterName}. Say hello and introduce yourself naturally.\n\n`;
      prompt += `${characterName}:`;
    } else if (type === 'continue') {
      prompt += `Conversation history:\n`;
      conversationHistory.forEach(message => {
        prompt += `${message}\n`;
      });
      prompt += `\nContinue the conversation naturally as ${characterName}.\n\n`;
      prompt += `${characterName}:`;
    } else if (type === 'leave') {
      prompt += `Conversation history:\n`;
      conversationHistory.forEach(message => {
        prompt += `${message}\n`;
      });
      prompt += `\nYou want to politely end this conversation. Say goodbye naturally.\n\n`;
      prompt += `${characterName}:`;
    }

    const maxTokens = type === 'start' ? 50 : type === 'leave' ? 30 : 80;
    let response = await this.generateResponse(prompt, maxTokens);
    
    // Clean up the response
    response = this.cleanResponse(response, characterName, otherCharacterName);
    
    return response;
  }

  private cleanResponse(response: string, characterName: string, otherCharacterName?: string): string {
    // Remove any character name prefixes that might have been generated
    response = response.replace(new RegExp(`^${characterName}:?\\s*`, 'i'), '');
    if (otherCharacterName) {
      response = response.replace(new RegExp(`^${otherCharacterName}:?\\s*`, 'i'), '');
    }
    
    // Remove any trailing conversation starters or responses
    response = response.replace(/\n.*$/s, ''); // Remove everything after first newline
    
    // Limit length and ensure it ends properly
    response = response.substring(0, 200).trim();
    
    // Ensure it doesn't end mid-sentence
    const sentences = response.split(/[.!?]+/);
    if (sentences.length > 1) {
      sentences.pop(); // Remove potentially incomplete last sentence
      response = sentences.join('.') + '.';
    }
    
    return response || "Hi there!"; // Fallback if response is empty
  }

  isReady(): boolean {
    return this.textGenerator !== null && !this.isLoading;
  }

  getLoadingStatus(): { isLoading: boolean; isReady: boolean } {
    return {
      isLoading: this.isLoading,
      isReady: this.isReady()
    };
  }
}

// Export singleton instance
export const clientLLM = new ClientLLMService();