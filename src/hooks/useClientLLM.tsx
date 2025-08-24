import { useQuery, useMutation } from 'convex/react';
import { useCallback, useEffect, useState } from 'react';
import { api, internal } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { 
  generateStartConversationMessage, 
  generateContinueConversationMessage, 
  generateLeaveConversationMessage,
  initializeClientLLM,
  getClientLLMStatus,
  ConversationContext
} from '../lib/clientConversation';

export function useClientLLMProcessor(worldId?: Id<'worlds'>) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Query for pending client LLM requests
  const pendingRequests = useQuery(api.clientLLMRequests.getPendingRequests, 
    worldId ? { worldId } : 'skip'
  );

  // Mutation to complete a client LLM request
  const completeRequest = useMutation(api.clientLLMRequests.completeRequest);
  
  // Initialize the client LLM on mount
  useEffect(() => {
    const init = async () => {
      try {
        console.log('Initializing client-side LLM...');
        await initializeClientLLM();
        setIsInitialized(true);
        console.log('Client-side LLM initialized successfully');
      } catch (error) {
        console.error('Failed to initialize client-side LLM:', error);
      }
    };
    
    if (!isInitialized) {
      init();
    }
  }, [isInitialized]);

  // Process pending requests
  useEffect(() => {
    const processRequests = async () => {
      if (!isInitialized || isProcessing || !pendingRequests || pendingRequests.length === 0) {
        return;
      }

      setIsProcessing(true);
      
      try {
        // Process requests one by one to avoid overwhelming the browser
        for (const request of pendingRequests.slice(0, 1)) { // Process only one at a time
          console.log(`Processing client LLM request: ${request.operationId}`);
          
          try {
            let generatedText: string;
            const context: ConversationContext = request.conversationContext;
            
            switch (request.type) {
              case 'start':
                generatedText = await generateStartConversationMessage(context);
                break;
              case 'continue':
                generatedText = await generateContinueConversationMessage(context);
                break;
              case 'leave':
                generatedText = await generateLeaveConversationMessage(context);
                break;
              default:
                throw new Error(`Unknown request type: ${request.type}`);
            }

            console.log(`Generated text for ${request.operationId}:`, generatedText);

            // Complete the request with the generated text
            await completeRequest({
              requestId: request._id,
              generatedText,
              success: true,
            });

          } catch (error) {
            console.error(`Failed to process request ${request.operationId}:`, error);
            
            // Mark the request as failed
            await completeRequest({
              requestId: request._id,
              generatedText: '',
              success: false,
            });
          }
        }
      } catch (error) {
        console.error('Error processing client LLM requests:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    processRequests();
  }, [pendingRequests, isInitialized, isProcessing, completeRequest]);

  const status = getClientLLMStatus();

  return {
    isInitialized,
    isProcessing,
    pendingRequestCount: pendingRequests?.length || 0,
    llmStatus: status,
  };
}

export function ClientLLMProcessor({ worldId }: { worldId?: Id<'worlds'> }) {
  const { isInitialized, isProcessing, pendingRequestCount, llmStatus } = useClientLLMProcessor(worldId);

  // This component runs the client LLM processing in the background
  // It can optionally show status information during development

  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-sm max-w-xs">
        <div className="font-semibold mb-1">Client LLM Status</div>
        <div>LLM Ready: {llmStatus.isReady ? '✅' : '❌'}</div>
        <div>Loading: {llmStatus.isLoading ? '⏳' : '✅'}</div>
        <div>Processing: {isProcessing ? '⚙️' : '✅'}</div>
        <div>Pending: {pendingRequestCount}</div>
      </div>
    );
  }

  return null; // Hidden in production
}