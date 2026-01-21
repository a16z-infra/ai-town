// ═══════════════════════════════════════════════════════════════════════════════
// XAI VISION INTEGRATION
// Provides image and video understanding capabilities to X402 World agents
// ═══════════════════════════════════════════════════════════════════════════════

export interface VisionOptions {
  // Image understanding options
  enableImageUnderstanding?: boolean;
  enableVideoUnderstanding?: boolean;
  
  // Structured output for vision analysis
  structuredOutput?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
  
  // Search tools to combine with vision
  useWebSearch?: boolean;
  useXSearch?: boolean;
}

export interface VisionResult {
  text: string;
  structuredData?: any;
  citations?: string[];
  toolUsage?: {
    viewImage?: number;
    viewXVideo?: number;
    webSearch?: number;
    xSearch?: number;
  };
}

/**
 * Analyze an image using xAI's vision capabilities
 */
export async function analyzeImage(
  imageUrl: string,
  prompt: string,
  systemPrompt?: string,
  options: VisionOptions = {}
): Promise<VisionResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY not set. Run: npx convex env set XAI_API_KEY "your-key"');
  }

  const tools: any[] = [];
  
  // Add search tools if requested
  if (options.useWebSearch) {
    tools.push({ type: 'web_search' });
  }
  if (options.useXSearch) {
    tools.push({ type: 'x_search' });
  }

  const messages: any[] = [];
  
  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  messages.push({
    role: 'user',
    content: [
      {
        type: 'text',
        text: prompt,
      },
      {
        type: 'image_url',
        image_url: {
          url: imageUrl,
        },
      },
    ],
  });

  const requestBody: any = {
    model: 'grok-4-1-fast',
    messages,
  };

  if (tools.length > 0) {
    requestBody.tools = tools;
  }

  // Add structured output if requested
  if (options.structuredOutput) {
    requestBody.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'vision_analysis',
        strict: true,
        schema: options.structuredOutput,
      },
    };
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

    const text = message.content || '';
    let structuredData: any = undefined;

    // Parse structured output if present
    if (options.structuredOutput) {
      try {
        structuredData = JSON.parse(text);
      } catch {
        // If parsing fails, structuredData remains undefined
      }
    }

    // Extract citations
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
        if (usage.tool === 'view_image') {
          toolUsage.viewImage = usage.count || 0;
        } else if (usage.tool === 'view_x_video') {
          toolUsage.viewXVideo = usage.count || 0;
        } else if (usage.tool === 'web_search') {
          toolUsage.webSearch = usage.count || 0;
        } else if (usage.tool === 'x_search') {
          toolUsage.xSearch = usage.count || 0;
        }
      }
    }

    return {
      text,
      structuredData,
      citations: citations.length > 0 ? citations : undefined,
      toolUsage: Object.keys(toolUsage).length > 0 ? toolUsage : undefined,
    };
  } catch (error: any) {
    throw new Error(`xAI vision analysis failed: ${error.message}`);
  }
}

/**
 * Analyze multiple images
 */
export async function analyzeImages(
  imageUrls: string[],
  prompt: string,
  systemPrompt?: string,
  options: VisionOptions = {}
): Promise<VisionResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY not set. Run: npx convex env set XAI_API_KEY "your-key"');
  }

  const tools: any[] = [];
  if (options.useWebSearch) {
    tools.push({ type: 'web_search' });
  }
  if (options.useXSearch) {
    tools.push({ type: 'x_search' });
  }

  const messages: any[] = [];
  
  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  const content: any[] = [{ type: 'text', text: prompt }];
  for (const imageUrl of imageUrls) {
    content.push({
      type: 'image_url',
      image_url: { url: imageUrl },
    });
  }

  messages.push({
    role: 'user',
    content,
  });

  const requestBody: any = {
    model: 'grok-4-1-fast',
    messages,
  };

  if (tools.length > 0) {
    requestBody.tools = tools;
  }

  if (options.structuredOutput) {
    requestBody.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'vision_analysis',
        strict: true,
        schema: options.structuredOutput,
      },
    };
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

    const text = message.content || '';
    let structuredData: any = undefined;

    if (options.structuredOutput) {
      try {
        structuredData = JSON.parse(text);
      } catch {
        // If parsing fails, structuredData remains undefined
      }
    }

    const citations: string[] = [];
    if (data.citations) {
      for (const citation of data.citations) {
        if (citation.url) {
          citations.push(citation.url);
        }
      }
    }

    const toolUsage: any = {};
    if (data.usage?.server_side_tool_usage) {
      for (const usage of data.usage.server_side_tool_usage) {
        if (usage.tool === 'view_image') {
          toolUsage.viewImage = usage.count || 0;
        } else if (usage.tool === 'view_x_video') {
          toolUsage.viewXVideo = usage.count || 0;
        } else if (usage.tool === 'web_search') {
          toolUsage.webSearch = usage.count || 0;
        } else if (usage.tool === 'x_search') {
          toolUsage.xSearch = usage.count || 0;
        }
      }
    }

    return {
      text,
      structuredData,
      citations: citations.length > 0 ? citations : undefined,
      toolUsage: Object.keys(toolUsage).length > 0 ? toolUsage : undefined,
    };
  } catch (error: any) {
    throw new Error(`xAI vision analysis failed: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISION ANALYSIS SCHEMAS
// Pre-defined schemas for common vision tasks
// ═══════════════════════════════════════════════════════════════════════════════

export const ImageAnalysisSchema = {
  type: 'object',
  properties: {
    description: {
      type: 'string',
      description: 'Detailed description of the image',
    },
    objects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 100 },
          location: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              width: { type: 'number' },
              height: { type: 'number' },
            },
          },
        },
      },
      description: 'Objects detected in the image',
    },
    text: {
      type: 'array',
      items: { type: 'string' },
      description: 'Text extracted from the image',
    },
    sentiment: {
      type: 'string',
      enum: ['positive', 'negative', 'neutral'],
      description: 'Overall sentiment of the image',
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Relevant tags for the image',
    },
  },
  required: ['description'],
  additionalProperties: false,
};

export const ChartAnalysisSchema = {
  type: 'object',
  properties: {
    chart_type: {
      type: 'string',
      enum: ['line', 'bar', 'pie', 'candlestick', 'scatter', 'other'],
      description: 'Type of chart',
    },
    data_points: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          value: { type: 'number' },
          timestamp: { type: 'string' },
        },
      },
      description: 'Extracted data points from the chart',
    },
    trends: {
      type: 'array',
      items: { type: 'string' },
      description: 'Identified trends in the data',
    },
    insights: {
      type: 'array',
      items: { type: 'string' },
      description: 'Key insights from the chart',
    },
  },
  required: ['chart_type', 'data_points'],
  additionalProperties: false,
};

export const DocumentAnalysisSchema = {
  type: 'object',
  properties: {
    document_type: {
      type: 'string',
      description: 'Type of document (invoice, contract, receipt, etc.)',
    },
    extracted_fields: {
      type: 'object',
      additionalProperties: true,
      description: 'Key-value pairs of extracted information',
    },
    summary: {
      type: 'string',
      description: 'Summary of the document',
    },
    key_dates: {
      type: 'array',
      items: { type: 'string' },
      description: 'Important dates found in the document',
    },
    amounts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: { type: 'number' },
          currency: { type: 'string' },
          context: { type: 'string' },
        },
      },
      description: 'Monetary amounts found',
    },
  },
  required: ['document_type', 'extracted_fields'],
  additionalProperties: false,
};
