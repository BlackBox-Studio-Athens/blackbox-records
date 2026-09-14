import { useEffect, useState } from 'react';
import { PortableTextEditor, type PortableTextEditorProps } from '@emdash-cms/admin';
import { loadMessages, LocaleDirectionProvider } from '@emdash-cms/admin/locales';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@emdash-cms/admin/styles.css';

export default function ContentBodyEditor(props: PortableTextEditorProps) {
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
          <PortableTextEditor {...props} />
        </QueryClientProvider>
      </LocaleDirectionProvider>
    </I18nProvider>
  );
}
