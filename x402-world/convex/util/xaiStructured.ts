// ═══════════════════════════════════════════════════════════════════════════════
// XAI STRUCTURED OUTPUTS INTEGRATION
// Provides structured, type-safe responses from xAI's Grok model
// ═══════════════════════════════════════════════════════════════════════════════

export interface StructuredOutputOptions {
  // Schema definition (JSON Schema format)
  schema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
    additionalProperties?: boolean;
  };
  // Whether to use tools (web_search, x_search) with structured output
  useTools?: boolean;
  toolOptions?: {
    webSearch?: boolean;
    xSearch?: boolean;
    allowedXHandles?: string[];
    excludedXHandles?: string[];
    fromDate?: string;
    toDate?: string;
    allowedDomains?: string[];
    excludedDomains?: string[];
  };
}

export interface StructuredResult<T = any> {
  data: T;
  rawResponse: string;
  citations?: string[];
  toolUsage?: {
    webSearch?: number;
    xSearch?: number;
    viewImage?: number;
    viewXVideo?: number;
  };
}

/**
 * Get structured output from xAI using a JSON schema
 */
export async function getStructuredOutput<T = any>(
  prompt: string,
  systemPrompt: string,
  options: StructuredOutputOptions
): Promise<StructuredResult<T>> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY not set. Run: npx convex env set XAI_API_KEY "your-key"');
  }

  const tools: any[] = [];
  
  // Add search tools if requested
  if (options.useTools) {
    if (options.toolOptions?.webSearch) {
      const webSearchTool: any = { type: 'web_search' };
      if (options.toolOptions.allowedDomains) {
        webSearchTool.allowed_domains = options.toolOptions.allowedDomains.slice(0, 5);
      }
      if (options.toolOptions.excludedDomains) {
        webSearchTool.excluded_domains = options.toolOptions.excludedDomains.slice(0, 5);
      }
      tools.push(webSearchTool);
    }
    
    if (options.toolOptions?.xSearch) {
      const xSearchTool: any = { type: 'x_search' };
      if (options.toolOptions.allowedXHandles) {
        xSearchTool.allowed_x_handles = options.toolOptions.allowedXHandles.slice(0, 10);
      }
      if (options.toolOptions.excludedXHandles) {
        xSearchTool.excluded_x_handles = options.toolOptions.excludedXHandles.slice(0, 10);
      }
      if (options.toolOptions.fromDate) {
        xSearchTool.from_date = options.toolOptions.fromDate;
      }
      if (options.toolOptions.toDate) {
        xSearchTool.to_date = options.toolOptions.toDate;
      }
      tools.push(xSearchTool);
    }
  }

  const requestBody: any = {
    model: 'grok-4-1-fast',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    // xAI structured outputs format (OpenAI-compatible)
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'structured_output',
        strict: true,
        schema: options.schema,
      },
    },
  };

  if (tools.length > 0) {
    requestBody.tools = tools;
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`xAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    if (!message) {
      throw new Error('No response from xAI');
    }

    const rawResponse = message.content || '';
    
    // Parse the JSON response
    let parsedData: T;
    try {
      parsedData = JSON.parse(rawResponse) as T;
    } catch (parseError) {
      throw new Error(`Failed to parse structured output: ${parseError}`);
    }

    // Extract citations if available
    const citations: string[] = [];
    if (data.citations) {
      for (const citation of data.citations) {
        if (citation.url) {
          citations.push(citation.url);
        }
      }
    }

    // Extract tool usage
    const toolUsage: any = {};
    if (data.usage?.server_side_tool_usage) {
      for (const usage of data.usage.server_side_tool_usage) {
        if (usage.tool === 'web_search') {
          toolUsage.webSearch = usage.count || 0;
        } else if (usage.tool === 'x_search') {
          toolUsage.xSearch = usage.count || 0;
        } else if (usage.tool === 'view_image') {
          toolUsage.viewImage = usage.count || 0;
        } else if (usage.tool === 'view_x_video') {
          toolUsage.viewXVideo = usage.count || 0;
        }
      }
    }

    return {
      data: parsedData,
      rawResponse,
      citations: citations.length > 0 ? citations : undefined,
      toolUsage: Object.keys(toolUsage).length > 0 ? toolUsage : undefined,
    };
  } catch (error: any) {
    throw new Error(`xAI structured output failed: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMON SCHEMAS FOR X402 WORLD
// Pre-defined schemas for common agent operations
// ═══════════════════════════════════════════════════════════════════════════════

export const TransactionAnalysisSchema = {
  type: 'object',
  properties: {
    risk_level: {
      type: 'string',
      enum: ['low', 'medium', 'high', 'critical'],
      description: 'Risk assessment of the transaction',
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 100,
      description: 'Confidence score (0-100)',
    },
    recommendations: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of recommendations',
    },
    estimated_value: {
      type: 'number',
      minimum: 0,
      description: 'Estimated value in USDC',
    },
    flags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Any warning flags or concerns',
    },
  },
  required: ['risk_level', 'confidence', 'recommendations'],
  additionalProperties: false,
};

export const SignalAnalysisSchema = {
  type: 'object',
  properties: {
    signal_type: {
      type: 'string',
      enum: ['buy', 'sell', 'hold', 'swap', 'stake', 'delegate'],
      description: 'Type of trading signal',
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 100,
      description: 'Confidence score (0-100)',
    },
    reasoning: {
      type: 'string',
      description: 'Explanation for the signal',
    },
    target_price: {
      type: 'number',
      description: 'Target price if applicable',
    },
    stop_loss: {
      type: 'number',
      description: 'Stop loss price if applicable',
    },
    timeframe: {
      type: 'string',
      description: 'Recommended timeframe for the signal',
    },
  },
  required: ['signal_type', 'confidence', 'reasoning'],
  additionalProperties: false,
};

export const MarketSummarySchema = {
  type: 'object',
  properties: {
    overall_sentiment: {
      type: 'string',
      enum: ['bullish', 'bearish', 'neutral'],
      description: 'Overall market sentiment',
    },
    key_events: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          event: { type: 'string' },
          impact: { type: 'string', enum: ['low', 'medium', 'high'] },
          timestamp: { type: 'string' },
        },
        required: ['event', 'impact'],
      },
      description: 'Key market events',
    },
    price_trends: {
      type: 'object',
      properties: {
        sol: { type: 'number' },
        usdc: { type: 'number' },
        trend: { type: 'string', enum: ['up', 'down', 'stable'] },
      },
      description: 'Price trends for major tokens',
    },
    recommendations: {
      type: 'array',
      items: { type: 'string' },
      description: 'Trading recommendations',
    },
  },
  required: ['overall_sentiment', 'key_events'],
  additionalProperties: false,
};

export const AgentDecisionSchema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      description: 'The action to take',
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 100,
      description: 'Confidence in the decision (0-100)',
    },
    reasoning: {
      type: 'string',
      description: 'Explanation for the decision',
    },
    expected_outcome: {
      type: 'string',
      description: 'Expected result of the action',
    },
    risk_assessment: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      description: 'Risk level of the action',
    },
    alternatives: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          confidence: { type: 'number' },
        },
      },
      description: 'Alternative actions considered',
    },
  },
  required: ['action', 'confidence', 'reasoning'],
  additionalProperties: false,
};
