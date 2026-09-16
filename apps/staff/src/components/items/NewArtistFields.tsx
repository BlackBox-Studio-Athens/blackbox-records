import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import EditorialPicker from './EditorialPicker';
import { createEditorialDraft, editorialSlug, type EditorialRecord } from '../../lib/backend/editorial-api';

type ArtistDraft = Parameters<typeof createEditorialDraft>[2];
export default function NewArtistFields({ base, onCreated }: { base: string; onCreated(item: EditorialRecord): void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('');
  const [alt, setAlt] = useState('');
  const [pending, setPending] = useState<ArtistDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const fields = useRef<HTMLFieldSetElement>(null);
  const storageKey = `blackbox-new-artist:${base}`;
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      try {
        setPending(JSON.parse(saved) as ArtistDraft);
        setOpen(true);
        setMessage('Check the last artist before creating another.');
      } catch {
        setMessage('The saved artist could not be read. Ask a label administrator for help.');
      }
    }
  }, []);
  async function save() {
    if (busy) return;
    if (!pending && fields.current) {
      for (const input of fields.current.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        'input,textarea,select',
      )) {
        if (!input.reportValidity()) return;
      }
    }
    setBusy(true);
    setMessage('');
    try {
      const command = pending ?? {
        slug: editorialSlug(title, crypto.randomUUID()),
        data: {
          title: title.trim(),
          genre: genre.trim(),
          bio: bio.trim(),
          image: { id: image },
          image_alt: alt.trim(),
        },
      };
      sessionStorage.setItem(storageKey, JSON.stringify(command));
      setPending(command);
      const result = await createEditorialDraft(base, 'artists', command);
      sessionStorage.removeItem(storageKey);
      setPending(null);
      setOpen(false);
      setMessage('Artist saved and selected.');
      onCreated(result.item);
    } catch {
      setMessage('We could not confirm the artist. Select Check artist.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-4">
      {!open && (
        <Button type="button" onClick={() => setOpen(true)}>
          Add a new artist
        </Button>
      )}
      {open && (
        <>
          <fieldset
            ref={fields}
            disabled={busy || !!pending}
            className="grid min-w-0 gap-4 border-t border-border pt-4"
          >
            <legend className="text-lg font-semibold">New artist</legend>
            <label className="grid gap-2">
              Artist name
              <Input required value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="grid gap-2">
              Genre
              <Input required value={genre} onChange={(event) => setGenre(event.target.value)} />
            </label>
            <label className="grid gap-2">
              Short biography
              <textarea
                required
                className="w-full border border-border bg-background p-2"
                rows={4}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              />
            </label>
            <EditorialPicker
              base={base}
              collection="media"
              label="Artist photo"
              value={image}
              onSelect={(item) => setImage(item.id)}
            />
            <label className="grid gap-2">
              Describe the artist photo
              <Input required value={alt} onChange={(event) => setAlt(event.target.value)} />
            </label>
          </fieldset>
          <Button type="button" disabled={busy} onClick={() => void save()}>
            {busy ? 'Checking artist…' : pending ? 'Check artist' : 'Save artist'}
          </Button>
          {!pending && (
            <Button type="button" disabled={busy} onClick={() => setOpen(false)}>
              Cancel new artist
            </Button>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
