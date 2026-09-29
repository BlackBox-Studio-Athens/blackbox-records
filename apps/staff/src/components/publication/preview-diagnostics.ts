export type PreviewDiagnostic = {
  requestId?: string | undefined;
  release: string;
  stage: 'request' | 'access' | 'timeout' | 'style' | 'image' | 'font' | 'freshness';
  requestedGeneration?: number;
  displayedGeneration?: number;
  readiness?: 'failed';
  readinessStage?: 'frame' | 'script' | 'hydration' | 'styles' | 'images' | 'fonts';
  asset?: string | undefined;
  directive?: string | undefined;
};
