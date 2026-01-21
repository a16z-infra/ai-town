// ═══════════════════════════════════════════════════════════════════════════════
// XAI SEARCH INTEGRATION
// Provides X Search and Web Search capabilities to X402 World agents
// Uses xAI API directly via HTTP (compatible with Convex)
// ═══════════════════════════════════════════════════════════════════════════════

export interface SearchOptions {
  // X Search options
  allowedXHandles?: string[];
  excludedXHandles?: string[];
  fromDate?: string; // ISO8601 format: "YYYY-MM-DD"
  toDate?: string; // ISO8601 format: "YYYY-MM-DD"
  enableImageUnderstanding?: boolean;
  enableVideoUnderstanding?: boolean;
  
  // Web Search options
  allowedDomains?: string[];
  excludedDomains?: string[];
  
  // Common options
  enableInlineCitations?: boolean;
}

export interface SearchResult {
  text: string;
  citations?: string[];
  inlineCitations?: Array<{
    id: number;
    url: string;
    position: number;
  }>;
  toolUsage?: {
    webSearch?: number;
    xSearch?: number;
    viewImage?: number;
    viewXVideo?: number;
  };
}

/**
 * Perform a web search using xAI's Grok model via HTTP API
 */
export async function performWebSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY not set. Run: npx convex env set XAI_API_KEY "your-key"');
  }

  // xAI uses server-side tools - configure them in the request
  // According to xAI API, tools should be an array of tool objects
  const tools: any[] = [];
  
  // Web search tool configuration
  const webSearchTool: any = {
    type: 'web_search',
  };
  
  if (options.allowedDomains && options.allowedDomains.length > 0) {
    webSearchTool.allowed_domains = options.allowedDomains.slice(0, 5);
  }
  if (options.excludedDomains && options.excludedDomains.length > 0) {
    webSearchTool.excluded_domains = options.excludedDomains.slice(0, 5);
  }
  if (options.enableImageUnderstanding) {
    webSearchTool.enable_image_understanding = true;
  }
  
  // Only add tool if it has configuration or is the default
  tools.push(webSearchTool);

  // X search tool configuration if needed
  if (options.allowedXHandles || options.excludedXHandles || options.fromDate || options.toDate || options.enableVideoUnderstanding) {
    const xSearchTool: any = {
      type: 'x_search',
    };
    
    if (options.allowedXHandles && options.allowedXHandles.length > 0) {
      xSearchTool.allowed_x_handles = options.allowedXHandles.slice(0, 10);
    }
    if (options.excludedXHandles && options.excludedXHandles.length > 0) {
      xSearchTool.excluded_x_handles = options.excludedXHandles.slice(0, 10);
    }
    if (options.fromDate) {
      xSearchTool.from_date = options.fromDate;
    }
    if (options.toDate) {
      xSearchTool.to_date = options.toDate;
    }
    if (options.enableImageUnderstanding) {
      xSearchTool.enable_image_understanding = true;
    }
    if (options.enableVideoUnderstanding) {
      xSearchTool.enable_video_understanding = true;
    }
    
    tools.push(xSearchTool);
  }

  const requestBody: any = {
    model: 'grok-4-1-fast',
    messages: [
      {
        role: 'user',
        content: query,
      },
    ],
    tools,
  };

  if (options.enableInlineCitations) {
    requestBody.include = ['inline_citations'];
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
    
    // Debug: log response structure if needed
    if (!data.choices || data.choices.length === 0) {
      console.error('xAI API response structure:', JSON.stringify(data, null, 2));
      throw new Error('No choices in xAI response');
    }
    
    const message = data.choices[0]?.message;
    if (!message) {
      throw new Error('No message in xAI response');
    }

    const text = message.content || '';
    const citations: string[] = [];
    const inlineCitations: Array<{ id: number; url: string; position: number }> = [];

    // Extract citations if available (can be in response root or message)
    const responseCitations = data.citations || message.citations || [];
    for (const citation of responseCitations) {
      if (typeof citation === 'string') {
        citations.push(citation);
      } else if (citation.url) {
        citations.push(citation.url);
      }
    }

    // Extract inline citations if enabled
    const responseInlineCitations = data.inline_citations || message.inline_citations || [];
    for (const citation of responseInlineCitations) {
      if (citation.web_citation?.url) {
        inlineCitations.push({
          id: citation.id || inlineCitations.length + 1,
          url: citation.web_citation.url,
          position: citation.position || 0,
        });
      } else if (citation.x_citation?.url) {
        inlineCitations.push({
          id: citation.id || inlineCitations.length + 1,
          url: citation.x_citation.url,
          position: citation.position || 0,
        });
      }
    }

    // Extract tool usage from response
    const toolUsage: any = {};
    const usage = data.usage || {};
    
    // Check for server_side_tool_usage array
    if (usage.server_side_tool_usage && Array.isArray(usage.server_side_tool_usage)) {
      for (const toolUsageItem of usage.server_side_tool_usage) {
        const toolName = toolUsageItem.tool || toolUsageItem.name;
        const count = toolUsageItem.count || toolUsageItem.usage_count || 0;
        
        if (toolName === 'web_search' || toolName === 'WEB_SEARCH') {
          toolUsage.webSearch = count;
        } else if (toolName === 'x_search' || toolName === 'X_SEARCH') {
          toolUsage.xSearch = count;
        } else if (toolName === 'view_image' || toolName === 'SERVER_SIDE_TOOL_VIEW_IMAGE') {
          toolUsage.viewImage = count;
        } else if (toolName === 'view_x_video' || toolName === 'SERVER_SIDE_TOOL_VIEW_X_VIDEO') {
          toolUsage.viewXVideo = count;
        }
      }
    }

    return {
      text,
      citations: citations.length > 0 ? citations : undefined,
      inlineCitations: inlineCitations.length > 0 ? inlineCitations : undefined,
      toolUsage: Object.keys(toolUsage).length > 0 ? toolUsage : undefined,
    };
  } catch (error: any) {
    throw new Error(`xAI search failed: ${error.message}`);
  }
}

/**
 * Perform an X (Twitter) search using xAI's Grok model via HTTP API
 */
export async function performXSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY not set. Run: npx convex env set XAI_API_KEY "your-key"');
  }

  // X search tool configuration
  const xSearchTool: any = {
    type: 'x_search',
  };
  
  if (options.allowedXHandles && options.allowedXHandles.length > 0) {
    xSearchTool.allowed_x_handles = options.allowedXHandles.slice(0, 10);
  }
  if (options.excludedXHandles && options.excludedXHandles.length > 0) {
    xSearchTool.excluded_x_handles = options.excludedXHandles.slice(0, 10);
  }
  if (options.fromDate) {
    xSearchTool.from_date = options.fromDate;
  }
  if (options.toDate) {
    xSearchTool.to_date = options.toDate;
  }
  if (options.enableImageUnderstanding) {
    xSearchTool.enable_image_understanding = true;
  }
  if (options.enableVideoUnderstanding) {
    xSearchTool.enable_video_understanding = true;
  }

  const requestBody: any = {
    model: 'grok-4-1-fast',
    messages: [
      {
        role: 'user',
        content: query,
      },
    ],
    tools: [xSearchTool],
  };

  if (options.enableInlineCitations) {
    requestBody.include = ['inline_citations'];
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
    
    // Debug: log response structure if needed
    if (!data.choices || data.choices.length === 0) {
      console.error('xAI API response structure:', JSON.stringify(data, null, 2));
      throw new Error('No choices in xAI response');
    }
    
    const message = data.choices[0]?.message;
    if (!message) {
      throw new Error('No message in xAI response');
    }

    const text = message.content || '';
    const citations: string[] = [];
    const inlineCitations: Array<{ id: number; url: string; position: number }> = [];

    // Extract citations if available (can be in response root or message)
    const responseCitations = data.citations || message.citations || [];
    for (const citation of responseCitations) {
      if (typeof citation === 'string') {
        citations.push(citation);
      } else if (citation.url) {
        citations.push(citation.url);
      }
    }

    // Extract inline citations if enabled
    const responseInlineCitations = data.inline_citations || message.inline_citations || [];
    for (const citation of responseInlineCitations) {
      if (citation.x_citation?.url) {
        inlineCitations.push({
          id: citation.id || inlineCitations.length + 1,
          url: citation.x_citation.url,
          position: citation.position || 0,
        });
      }
    }

    // Extract tool usage from response
    const toolUsage: any = {};
    const usage = data.usage || {};
    
    // Check for server_side_tool_usage array
    if (usage.server_side_tool_usage && Array.isArray(usage.server_side_tool_usage)) {
      for (const toolUsageItem of usage.server_side_tool_usage) {
        const toolName = toolUsageItem.tool || toolUsageItem.name;
        const count = toolUsageItem.count || toolUsageItem.usage_count || 0;
        
        if (toolName === 'x_search' || toolName === 'X_SEARCH') {
          toolUsage.xSearch = count;
        } else if (toolName === 'view_image' || toolName === 'SERVER_SIDE_TOOL_VIEW_IMAGE') {
          toolUsage.viewImage = count;
        } else if (toolName === 'view_x_video' || toolName === 'SERVER_SIDE_TOOL_VIEW_X_VIDEO') {
          toolUsage.viewXVideo = count;
        }
      }
    }

    return {
      text,
      citations: citations.length > 0 ? citations : undefined,
      inlineCitations: inlineCitations.length > 0 ? inlineCitations : undefined,
      toolUsage: Object.keys(toolUsage).length > 0 ? toolUsage : undefined,
    };
  } catch (error: any) {
    throw new Error(`xAI X search failed: ${error.message}`);
  }
}

/**
 * Perform a combined web and X search
 */
export async function performCombinedSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult> {
  // Use web search with X search enabled
  return performWebSearch(query, {
    ...options,
    // Enable X search by providing at least one X search option
    allowedXHandles: options.allowedXHandles || undefined,
  });
}
