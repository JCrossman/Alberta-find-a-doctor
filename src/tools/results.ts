export interface TextContent {
  text: string;
  type: 'text';
}

export interface ToolResult {
  [key: string]: unknown;
  content: TextContent[];
  isError?: boolean;
}

export function formattingDirective(
  hint: 'detail' | 'grouped_tables' | 'table',
  columns?: string[],
): TextContent {
  if (hint === 'detail') {
    return {
      type: 'text',
      text: 'Render as key-value pairs under clear headings. Bold field names.',
    };
  }

  if (hint === 'grouped_tables') {
    return {
      type: 'text',
      text: 'Render each group as its own markdown table under a heading. Lead with a brief summary.',
    };
  }

  const columnText = columns?.length ? ` Columns: ${columns.join(' | ')}.` : '';
  return {
    type: 'text',
    text: `Render as a markdown table.${columnText} Lead with a one or two sentence summary.`,
  };
}

export function errorResult(error: unknown, fallback: string): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: error instanceof Error ? error.message : fallback,
      },
    ],
    isError: true,
  };
}
