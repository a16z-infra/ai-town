// Simple replacement for useSendInput
export function useSendInput(engineId: any, name: string) {
  return async (args: any) => {
    console.log('Static useSendInput called:', { engineId, name, args });
    return { success: true };
  };
}