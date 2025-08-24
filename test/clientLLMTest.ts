import { clientLLM } from '../src/lib/clientLLM';

async function testClientLLM() {
  console.log('Testing client-side LLM...');
  
  try {
    console.log('Initializing LLM...');
    await clientLLM.initialize();
    console.log('✅ LLM initialized successfully');
    
    console.log('Testing text generation...');
    const response = await clientLLM.generateResponse('Hello, my name is Alice and I like', 20);
    console.log('Generated text:', response);
    
    console.log('Testing conversation generation...');
    const conversationResponse = await clientLLM.generateConversationMessage(
      'Alice',
      'Alice is a friendly scientist who loves to discover new things.',
      [],
      'start',
      'Bob'
    );
    console.log('Generated conversation:', conversationResponse);
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Only run if this is being executed directly
if (typeof window !== 'undefined') {
  testClientLLM();
} else {
  console.log('This test can only run in a browser environment');
}