export type PreviewDiagnostic = {
  requestId?: string | undefined;
  release: string;
  stage: 'request' | 'timeout' | 'style' | 'image' | 'font' | 'freshness';
  requestedGeneration?: number;
  displayedGeneration?: number;
  readiness?: 'failed';
  asset?: string | undefined;
  directive?: string | undefined;
};
