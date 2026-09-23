import { useCallback, useEffect, useState } from 'react';
import { PortableTextEditor, type PortableTextEditorProps } from '@emdash-cms/admin';
import { loadMessages, LocaleDirectionProvider } from '@emdash-cms/admin/locales';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import editorStyles from '../../styles/content-editor.css?inline';
import { staffEntry } from '../../lib/staff-navigation';

// EmDash's public admin entrypoint initializes router history while loading.
// Restore our current entry even if this lazy module resolves after leaving the editor.
if (typeof window !== 'undefined') staffEntry();

export default function ContentBodyEditor(
  props: PortableTextEditorProps & {
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    'data-content-path'?: string;
    onBlur?: () => void;
  },
) {
  const onEditorReady = useCallback<NonNullable<PortableTextEditorProps['onEditorReady']>>(
    (editor) => {
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
          <PortableTextEditor
            {...props}
            className={`${props.className ?? ''} [&_button]:min-h-11 [&_button]:min-w-11`}
            onEditorReady={onEditorReady}
          />
        </QueryClientProvider>
      </LocaleDirectionProvider>
    </I18nProvider>
  );
}
