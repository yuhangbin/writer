export interface WorkspaceContext {
  targetReader?: string | null;
  referenceExample?: string | null;
}

export function buildPrompt(
  userInput: string,
  workspaceContext?: WorkspaceContext
): { system: string; user: string } {
  const { targetReader, referenceExample } = workspaceContext || {};

  // Build system message with audience context
  const systemMessage = `你是一个专业的文档写作助手。${
    targetReader
      ? `目标读者：${targetReader}。请根据目标读者调整语气、用词和内容深度。`
      : '请生成结构清晰、格式规范的文档。'
  }`;

  // Build user message with reference example
  let userMessage = '';

  if (referenceExample && referenceExample.trim()) {
    userMessage += `参考以下示例的格式、结构和风格：\n\n${referenceExample}\n\n---\n\n`;
  }

  userMessage += `请根据上述要求生成内容：\n\n${userInput}`;

  return { system: systemMessage, user: userMessage };
}
