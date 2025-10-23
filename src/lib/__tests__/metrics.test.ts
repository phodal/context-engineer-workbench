import {
  createMetricsCollector,
  recordFirstToken,
  finalizeMetrics,
  formatMetrics,
  calculateMetricsFromResponse,
} from '../metrics';

describe('Metrics Module', () => {
  describe('createMetricsCollector', () => {
    it('should create a metrics collector with initial values', () => {
      const collector = createMetricsCollector('gpt-4', 'OpenAI');

      expect(collector.model).toBe('gpt-4');
      expect(collector.provider).toBe('OpenAI');
      expect(collector.inputTokens).toBe(0);
      expect(collector.outputTokens).toBe(0);
      expect(collector.startTime).toBeLessThanOrEqual(Date.now());
      expect(collector.firstTokenTime).toBeUndefined();
    });
  });

  describe('recordFirstToken', () => {
    it('should record the first token time', () => {
      const collector = createMetricsCollector('gpt-4', 'OpenAI');
      const beforeRecord = Date.now();

      recordFirstToken(collector);

      const afterRecord = Date.now();
      expect(collector.firstTokenTime).toBeDefined();
      expect(collector.firstTokenTime!).toBeGreaterThanOrEqual(beforeRecord);
      expect(collector.firstTokenTime!).toBeLessThanOrEqual(afterRecord);
    });

    it('should not overwrite first token time if already set', () => {
      const collector = createMetricsCollector('gpt-4', 'OpenAI');

      recordFirstToken(collector);
      const firstTime = collector.firstTokenTime;

      // Wait a bit and record again
      recordFirstToken(collector);

      expect(collector.firstTokenTime).toBe(firstTime);
    });
  });

  describe('finalizeMetrics', () => {
    it('should calculate metrics correctly', () => {
      const collector = createMetricsCollector('gpt-4', 'OpenAI');
      collector.inputTokens = 100;
      collector.outputTokens = 50;

      // Simulate some time passing
      const startTime = collector.startTime;
      collector.startTime = startTime - 1000; // 1 second ago

      const metrics = finalizeMetrics(collector);

      expect(metrics.inputTokens).toBe(100);
      expect(metrics.outputTokens).toBe(50);
      expect(metrics.totalTokens).toBe(150);
      expect(metrics.model).toBe('gpt-4');
      expect(metrics.provider).toBe('OpenAI');
      expect(metrics.totalLatency).toBeGreaterThanOrEqual(1000);
      expect(metrics.tokensPerSecond).toBeGreaterThan(0);
      expect(metrics.averageLatencyPerToken).toBeGreaterThan(0);
    });

    it('should handle zero output tokens', () => {
      const collector = createMetricsCollector('gpt-4', 'OpenAI');
      collector.inputTokens = 100;
      collector.outputTokens = 0;

      const metrics = finalizeMetrics(collector);

      expect(metrics.tokensPerSecond).toBe(0);
      expect(metrics.averageLatencyPerToken).toBe(0);
    });

    it('should calculate first token latency correctly', () => {
      const collector = createMetricsCollector('gpt-4', 'OpenAI');
      const startTime = Date.now() - 1000; // 1 second ago

      // Simulate first token arriving 200ms after start
      collector.startTime = startTime;
      collector.firstTokenTime = startTime + 200;

      const metrics = finalizeMetrics(collector);

      expect(metrics.firstTokenLatency).toBeGreaterThanOrEqual(200);
      expect(metrics.firstTokenLatency).toBeLessThanOrEqual(metrics.totalLatency);
    });
  });

  describe('formatMetrics', () => {
    it('should format metrics for display', () => {
      const metrics = {
        firstTokenLatency: 150,
        totalLatency: 1000,
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        tokensPerSecond: 50,
        averageLatencyPerToken: 20,
        timestamp: Date.now(),
        model: 'gpt-4',
        provider: 'OpenAI',
      };

      const formatted = formatMetrics(metrics);

      expect(formatted['First Token Latency']).toBe('150ms');
      expect(formatted['Total Latency']).toBe('1000ms');
      expect(formatted['Input Tokens']).toBe('100');
      expect(formatted['Output Tokens']).toBe('50');
      expect(formatted['Total Tokens']).toBe('150');
      expect(formatted['Throughput']).toBe('50.00 tokens/s');
      expect(formatted['Avg Latency/Token']).toBe('20ms');
    });
  });

  describe('calculateMetricsFromResponse', () => {
    it('should calculate metrics from response data', () => {
      const startTime = Date.now() - 1000;
      const endTime = Date.now();
      const firstTokenTime = startTime + 200;

      const metrics = calculateMetricsFromResponse(
        startTime,
        endTime,
        firstTokenTime,
        100,
        50,
        'gpt-4',
        'OpenAI'
      );

      expect(metrics.inputTokens).toBe(100);
      expect(metrics.outputTokens).toBe(50);
      expect(metrics.totalTokens).toBe(150);
      expect(metrics.firstTokenLatency).toBeGreaterThanOrEqual(200);
      expect(metrics.totalLatency).toBeGreaterThanOrEqual(1000);
      expect(metrics.model).toBe('gpt-4');
      expect(metrics.provider).toBe('OpenAI');
    });

    it('should handle undefined first token time', () => {
      const startTime = Date.now() - 1000;
      const endTime = Date.now();

      const metrics = calculateMetricsFromResponse(
        startTime,
        endTime,
        undefined,
        100,
        50,
        'gpt-4',
        'OpenAI'
      );

      expect(metrics.firstTokenLatency).toBe(metrics.totalLatency);
    });
  });
});
