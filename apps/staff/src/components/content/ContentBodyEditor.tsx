import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  PortableTextEditor,
  ImageDetailPanel,
  MediaUploadProvider,
  fetchMediaItem,
  type PortableTextEditorProps,
} from '@emdash-cms/admin';
import { loadMessages, LocaleDirectionProvider } from '@emdash-cms/admin/locales';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import editorStyles from './content-editor.css?inline';
import { staffEntry } from '../../lib/staff-navigation';
import { uploadArtwork } from '../../lib/backend/editorial-api';
import { normalizeEditorialBody, normalizeVideoUrl } from '@blackbox/content-model';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

// EmDash's public admin entrypoint initializes router history while loading.
// Restore our current entry even if this lazy module resolves after leaving the editor.
if (typeof window !== 'undefined') staffEntry();

export default function ContentBodyEditor(
  props: PortableTextEditorProps & {
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    'data-content-path'?: string;
    onBlur?: () => void;
    base?: string;
    fullText?: boolean;
    onUploadPendingChange?: ((pending: boolean) => void) | undefined;
  },
) {
  const [imagePanel, setImagePanel] = useState<
    Parameters<NonNullable<PortableTextEditorProps['onBlockSidebarOpen']>>[0] | null
  >(null);
  const pendingUploads = useRef(0);
  const [uploadLifetime] = useState(() => new AbortController());
  useEffect(() => () => uploadLifetime.abort(), [uploadLifetime]);
  const editorRef = useRef<Parameters<NonNullable<PortableTextEditorProps['onEditorReady']>>[0]>(null);
  const videoId = useId();
  const [videoUrl, setVideoUrl] = useState('');
  const [videoError, setVideoError] = useState('');
  const upload = useCallback(
    async (file: File, options?: { signal?: AbortSignal }) => {
      if (!props.fullText) throw new Error('Short descriptions support text only.');
      const signal = options?.signal ? AbortSignal.any([options.signal, uploadLifetime.signal]) : uploadLifetime.signal;
      signal.throwIfAborted();
      if (pendingUploads.current++ === 0) props.onUploadPendingChange?.(true);
      try {
        const item = await uploadArtwork(props.base ?? '', file, signal);
        signal.throwIfAborted();
        const media = await fetchMediaItem(item.id);
        signal.throwIfAborted();
        return { ...media, provider: 'local' };
      } finally {
        if (--pendingUploads.current === 0) props.onUploadPendingChange?.(false);
      }
    },
    [props.base, props.fullText, props.onUploadPendingChange, uploadLifetime],
  );
  const onEditorReady = useCallback<NonNullable<PortableTextEditorProps['onEditorReady']>>(
    (editor) => {
      editorRef.current = editor;
      if (editor) {
        const input = editor.view.dom;
        input.setAttribute('role', 'textbox');
        input.setAttribute('aria-multiline', 'true');
        input.setAttribute('aria-readonly', String(props.editable === false));
        input.setAttribute('aria-invalid', String(props['aria-invalid'] === true));
        if (props['data-content-path']) input.setAttribute('data-content-path', props['data-content-path']);
        input.onblur = props.onBlur ?? null;
        if (props['aria-describedby']) input.setAttribute('aria-describedby', props['aria-describedby']);
        else input.removeAttribute('aria-describedby');
        if (props['aria-labelledby']) input.setAttribute('aria-labelledby', props['aria-labelledby']);
        else input.setAttribute('aria-label', 'Draft full text');
      }
      props.onEditorReady?.(editor);
    },
    [
      props.editable,
      props['aria-labelledby'],
      props['aria-describedby'],
      props['aria-invalid'],
      props['data-content-path'],
      props.onBlur,
      props.onEditorReady,
    ],
  );
  const [queries] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }),
  );
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void loadMessages('en').then((messages) => {
      i18n.load('en', messages);
      i18n.activate('en');
      setReady(true);
    });
  }, []);
  if (!ready) return <p role="status">Loading text editor…</p>;
  return (
    <I18nProvider i18n={i18n}>
      <style href="staff-content-editor" precedence="staff-feature">
        {editorStyles}
      </style>
      <LocaleDirectionProvider>
        <QueryClientProvider client={queries}>
          <MediaUploadProvider upload={upload}>
            {props.fullText && (
              <div className="mb-3 grid gap-2">
                <label htmlFor={videoId} className="text-sm">
                  YouTube or Vimeo video URL
                </label>
                <div className="flex flex-wrap gap-2">
                  <Input
                    id={videoId}
                    type="url"
                    value={videoUrl}
                    disabled={props.editable === false}
                    className="min-w-0 flex-1"
                    placeholder="https://…"
                    aria-invalid={!!videoError}
                    onChange={(event) => {
                      setVideoUrl(event.target.value);
                      setVideoError('');
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={props.editable === false || !videoUrl.trim()}
                    onClick={() => {
                      const src = normalizeVideoUrl(videoUrl.trim());
                      if (!src) {
                        setVideoError('Use a HTTPS YouTube or Vimeo video URL.');
                        return;
                      }
                      editorRef.current
                        ?.chain()
                        .focus()
                        .insertContent({
                          type: 'iframeBlock',
                          attrs: {
                            src,
                            title: 'Video',
                            allow: 'fullscreen; picture-in-picture',
                            allowFullscreen: true,
                          },
                        })
                        .run();
                      setVideoUrl('');
                    }}
                  >
                    Add video
                  </Button>
                </div>
                {videoError && (
                  <p role="alert" className="text-sm text-destructive">
                    {videoError}
                  </p>
                )}
              </div>
            )}
            <PortableTextEditor
              {...props}
              disabledBlockCommands={
                props.fullText
                  ? ['htmlBlock', 'gallery', 'section', 'table']
                  : ['htmlBlock', 'gallery', 'section', 'table', 'image', 'iframe', 'codeBlock', 'code']
              }
              onChange={(next) =>
                props.onChange?.((props.fullText ? normalizeEditorialBody(next) : next) as typeof next)
              }
              onBlockSidebarOpen={setImagePanel}
              onBlockSidebarClose={() => setImagePanel(null)}
              className={`${props.className ?? ''} [&_button]:min-h-11 [&_button]:min-w-11`}
              onEditorReady={onEditorReady}
            />
            {props.fullText && imagePanel?.type === 'image' && (
              <div className="mt-3 rounded-lg border border-border p-4">
                <ImageDetailPanel
                  inline
                  attributes={imagePanel.attrs}
                  onUpdate={imagePanel.onUpdate}
                  onReplace={imagePanel.onReplace}
                  onDelete={imagePanel.onDelete}
                  onClose={() => {
                    imagePanel.onClose();
                    setImagePanel(null);
                  }}
                />
              </div>
            )}
          </MediaUploadProvider>
        </QueryClientProvider>
      </LocaleDirectionProvider>
    </I18nProvider>
  );
}
