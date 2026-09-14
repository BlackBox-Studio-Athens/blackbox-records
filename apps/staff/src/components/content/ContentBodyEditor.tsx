import { useCallback, useEffect, useState } from 'react';
import { PortableTextEditor, type PortableTextEditorProps } from '@emdash-cms/admin';
import { loadMessages, LocaleDirectionProvider } from '@emdash-cms/admin/locales';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@emdash-cms/admin/styles.css';

export default function ContentBodyEditor(
  props: PortableTextEditorProps & { 'aria-describedby'?: string; 'aria-invalid'?: boolean },
) {
  const onEditorReady = useCallback<NonNullable<PortableTextEditorProps['onEditorReady']>>(
    (editor) => {
      if (editor) {
        const input = editor.view.dom;
        input.setAttribute('role', 'textbox');
        input.setAttribute('aria-multiline', 'true');
        input.setAttribute('aria-readonly', String(props.editable === false));
        input.setAttribute('aria-invalid', String(props['aria-invalid'] === true));
        if (props['aria-describedby']) input.setAttribute('aria-describedby', props['aria-describedby']);
        else input.removeAttribute('aria-describedby');
        if (props['aria-labelledby']) input.setAttribute('aria-labelledby', props['aria-labelledby']);
        else input.setAttribute('aria-label', 'Draft full text');
      }
      props.onEditorReady?.(editor);
    },
    [props.editable, props['aria-labelledby'], props['aria-describedby'], props['aria-invalid'], props.onEditorReady],
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
