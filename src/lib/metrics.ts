/**
 * LLM API Performance Metrics
 *
 * Tracks and calculates key performance indicators for LLM API calls:
 * - FirstToken Latency: Time to receive first token (TTFT)
 * - Total Time: End-to-end latency from request to complete response
 * - Throughput: Tokens per second
 * - Token counts: Input, output, and total tokens
 */

export interface APIMetrics {
  // Timing metrics (in milliseconds)
  firstTokenLatency: number; // Time to first token (TTFT)
  totalLatency: number; // Total end-to-end time

  // Token metrics
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;

  // Calculated metrics
  tokensPerSecond: number; // Output tokens / (totalLatency / 1000)
  averageLatencyPerToken: number; // totalLatency / outputTokens

  // Metadata
  timestamp: number; // When the request started
  model: string;
  provider: string;
}

export interface MetricsCollector {
  startTime: number;
  firstTokenTime?: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
  provider: string;
}

/**
 * Create a new metrics collector
 */
export function createMetricsCollector(model: string, provider: string): MetricsCollector {
  return {
    startTime: Date.now(),
    inputTokens: 0,
    outputTokens: 0,
    model,
    provider,
  };
}

/**
 * Record the first token received
 */
export function recordFirstToken(collector: MetricsCollector): void {
  if (!collector.firstTokenTime) {
    collector.firstTokenTime = Date.now();
  }
}

/**
 * Finalize metrics collection and calculate derived metrics
 */
export function finalizeMetrics(collector: MetricsCollector): APIMetrics {
  const now = Date.now();
  const totalLatency = now - collector.startTime;
  const firstTokenLatency = collector.firstTokenTime
    ? collector.firstTokenTime - collector.startTime
    : totalLatency;

  const totalTokens = collector.inputTokens + collector.outputTokens;
  const tokensPerSecond =
    collector.outputTokens > 0 ? collector.outputTokens / (totalLatency / 1000) : 0;
  const averageLatencyPerToken =
    collector.outputTokens > 0 ? totalLatency / collector.outputTokens : 0;

  return {
    firstTokenLatency,
    totalLatency,
    inputTokens: collector.inputTokens,
    outputTokens: collector.outputTokens,
    totalTokens,
    tokensPerSecond,
    averageLatencyPerToken,
    timestamp: collector.startTime,
    model: collector.model,
    provider: collector.provider,
  };
}

/**
 * Format time duration for display
 * Converts milliseconds to appropriate unit (ms, s, etc.)
 * For durations > 10s, displays in seconds instead of milliseconds
 */
export function formatDuration(ms: number): string {
  if (ms < 10000) {
    // For durations less than 10 seconds, show in milliseconds
    return `${Math.round(ms)}ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }
  const minutes = seconds / 60;
  return `${minutes.toFixed(2)}m`;
}

/**
 * Format metrics for display
 */
export function formatMetrics(metrics: APIMetrics): Record<string, string> {
  return {
    'First Token Latency': formatDuration(metrics.firstTokenLatency),
    'Total Latency': formatDuration(metrics.totalLatency),
    'Input Tokens': metrics.inputTokens.toString(),
    'Output Tokens': metrics.outputTokens.toString(),
    'Total Tokens': metrics.totalTokens.toString(),
    Throughput: `${metrics.tokensPerSecond.toFixed(2)} tokens/s`,
    'Avg Latency/Token': formatDuration(metrics.averageLatencyPerToken),
  };
}

/**
 * Calculate metrics from message metadata
 * Useful when metrics are embedded in the response
 */
export function calculateMetricsFromResponse(
  startTime: number,
  endTime: number,
  firstTokenTime: number | undefined,
  inputTokens: number,
  outputTokens: number,
  model: string,
  provider: string
): APIMetrics {
  const totalLatency = endTime - startTime;
  const firstTokenLatency = firstTokenTime ? firstTokenTime - startTime : totalLatency;

  const totalTokens = inputTokens + outputTokens;
  const tokensPerSecond = outputTokens > 0 ? outputTokens / (totalLatency / 1000) : 0;
  const averageLatencyPerToken = outputTokens > 0 ? totalLatency / outputTokens : 0;

  return {
    firstTokenLatency,
    totalLatency,
    inputTokens,
    outputTokens,
    totalTokens,
    tokensPerSecond,
    averageLatencyPerToken,
    timestamp: startTime,
    model,
    provider,
  };
}
