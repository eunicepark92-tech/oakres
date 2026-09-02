/**
 * Secure Client-Side Gemini Service
 * 
 * NOTE: This client communicates ONLY with our server's internal proxy endpoint (/api/generate).
 * No API keys, secret credentials, or authorization headers are stored or processed on the client.
 */

export interface GenerateOptions {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  responseMimeType?: string;
  responseSchema?: unknown;
}

export interface GenerateResult {
  text: string;
  status: 'success' | 'error';
  error?: string;
}

/**
 * Sends a generation request to the secure backend proxy endpoint.
 * Ensures user privacy by never logging the prompt or generated text in browser logs.
 */
export async function generateAiContent(options: GenerateOptions): Promise<GenerateResult> {
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!res.ok) {
      return {
        text: '',
        status: 'error',
        error: `AI 요청 실패 (상태 코드: ${res.status})`,
      };
    }

    const data = await res.json();
    return {
      text: data.text || '',
      status: 'success',
    };
  } catch {
    return {
      text: '',
      status: 'error',
      error: '네트워크 또는 서버 통신 오류가 발생했습니다.',
    };
  }
}
