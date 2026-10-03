import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import './store-image-gallery.css';
import { createImageSizes } from '@/platform/lib/editorial-image';

export type StoreGalleryImage = {
  src: string;
  srcSet: string;
  alt: string;
  width: number;
  height: number;
};

type StoreImageGalleryProps = {
  images: StoreGalleryImage[];
  title: string;
  priority?: boolean;
  interactive?: boolean;
};

export function getStoreGallerySwipeDelta(x: number, y: number) {
  return Math.abs(x) > 40 && Math.abs(x) > Math.abs(y) ? (x < 0 ? 1 : -1) : 0;
}

export function storeGalleryThumbnailSource(image: StoreGalleryImage) {
  // Commas are valid URL bytes in Cloudflare's transform options; width descriptors delimit candidates.
  const candidates = [...image.srcSet.matchAll(/(\S+)\s+(\d+)w/g)].map((match) => `${match[1]} ${match[2]}w`);
  const thumbnails = candidates.filter((candidate) => /\s(?:144|216)w$/.test(candidate));
  return { src: thumbnails.at(-1)?.replace(/\s\d+w$/, '') ?? image.src, srcSet: thumbnails.join(', ') };
}

/** `priority` matches the single cover: high fetch priority on routed pages, none inside overlay fragments. */
export default function StoreImageGallery({
  images,
  title,
  priority = true,
  interactive = true,
}: StoreImageGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(images[0]?.src);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  useEffect(() => {
    if (previous === null || loaded !== images[selected]?.src) return;
    const timeout = window.setTimeout(() => setPrevious(null), 260);
    return () => window.clearTimeout(timeout);
  }, [previous, selected, loaded, images]);
  if (images.length === 0) return null;
  const image = images[selected]!;
  const select = (index: number) => {
    const next = Math.max(0, Math.min(index, images.length - 1));
    if (!interactive || next === selected) return;
    setPrevious(previous !== null && loaded !== image.src ? previous : selected);
    setSelected(next);
  };

  return (
    <section
      className="store-image-gallery"
      aria-label={`${title} images`}
      aria-roledescription="carousel"
      onKeyDown={(event) => {
        if (!interactive) return;
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        select(selected + (event.key === 'ArrowLeft' ? -1 : 1));
      }}
    >
      <div
        className="store-image-gallery__stage"
        tabIndex={interactive ? 0 : undefined}
        onPointerDown={(event) => {
          if (!interactive || !event.isPrimary || event.button !== 0) return;
          pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerUp={(event) => {
          const start = pointer.current;
          if (!start || start.id !== event.pointerId) return;
          pointer.current = null;
          select(selected + getStoreGallerySwipeDelta(event.clientX - start.x, event.clientY - start.y));
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          pointer.current = null;
        }}
        onLostPointerCapture={() => {
          pointer.current = null;
        }}
      >
        {previous !== null && (
          <img
            key={`previous-${images[previous]!.src}`}
            src={images[previous]!.src}
            srcSet={images[previous]!.srcSet}
            sizes={createImageSizes(images[previous]!, [
              { media: '(min-width: 768px)', width: '26rem', frameAspectRatio: 1 },
              { width: '100vw - 32px', frameAspectRatio: 1 },
            ])}
            alt=""
            aria-hidden="true"
            width={images[previous]!.width}
            height={images[previous]!.height}
            className="store-image-gallery__previous"
            data-changing={loaded === image.src ? '' : undefined}
            draggable={false}
          />
        )}
        <img
          key={image.src}
          src={image.src}
          srcSet={image.srcSet}
          sizes={createImageSizes(images[selected]!, [
            { media: '(min-width: 768px)', width: '26rem', frameAspectRatio: 1 },
            { width: '100vw - 32px', frameAspectRatio: 1 },
          ])}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading="eager"
          fetchPriority={priority && selected === 0 ? 'high' : 'auto'}
          decoding="async"
          draggable={false}
          className="store-image-gallery__image"
          data-changing={previous !== null && loaded === image.src ? '' : undefined}
          data-waiting={previous !== null && loaded !== image.src ? '' : undefined}
          onLoad={() => setLoaded(image.src)}
        />
      </div>
      <div className="store-image-gallery__navigation">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous image"
          disabled={!interactive || selected === 0}
          onClick={() => select(selected - 1)}
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <p role="status" aria-live="polite" aria-atomic="true">
          {selected + 1} / {images.length}
        </p>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next image"
          disabled={!interactive || selected === images.length - 1}
          onClick={() => select(selected + 1)}
        >
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
      <div className="store-image-gallery__thumbnails" role="group" aria-label="Choose an image">
        {images.map((item, index) => (
          <Button
            key={item.src}
            variant="outline"
            size="icon"
            className="store-image-gallery__thumbnail"
            aria-label={`Show image ${index + 1}: ${item.alt}`}
            aria-pressed={index === selected}
            disabled={!interactive}
            onClick={() => select(index)}
          >
            <img
              src={storeGalleryThumbnailSource(item).src}
              srcSet={storeGalleryThumbnailSource(item).srcSet}
              sizes="72px"
              alt=""
              width={item.width}
              height={item.height}
              loading="lazy"
              decoding="async"
            />
          </Button>
        ))}
      </div>
    </section>
  );
}

/** Server HTML remains usable artwork while the shell loads the gallery module. */
export function StoreImageGalleryPlaceholder(props: StoreImageGalleryProps) {
  return (
    <div data-store-image-gallery={JSON.stringify(props)}>
      <div data-store-gallery-fallback>
        <StoreImageGallery {...props} interactive={false} />
      </div>
    </div>
  );
}

function StoreImageGalleryPortal({ container, props }: { container: HTMLElement; props: StoreImageGalleryProps }) {
  useLayoutEffect(() => {
    const fallback = container.querySelector<HTMLElement>('[data-store-gallery-fallback]');
    if (fallback) fallback.hidden = true;
    return () => {
      if (fallback) fallback.hidden = false;
    };
  }, [container]);
  return createPortal(
    <div data-store-gallery-live>
      <StoreImageGallery {...props} />
    </div>,
    container,
  );
}

/** Mount lazily from the shell after routed or overlay DOM has been applied. */
export function StoreImageGalleryPortals({ pageKey, root }: { pageKey: string; root?: ParentNode }) {
  const targets = useMemo(() => {
    const owner = root ?? (typeof document === 'undefined' ? undefined : document);
    return [...(owner?.querySelectorAll<HTMLElement>('[data-store-image-gallery]') ?? [])].flatMap((container) => {
      try {
        const props = JSON.parse(container.dataset.storeImageGallery ?? '') as StoreImageGalleryProps;
        return Array.isArray(props.images) && props.images.length && typeof props.title === 'string'
          ? [{ container, props }]
          : [];
      } catch {
        return [];
      }
    });
  }, [pageKey, root]);
  return (
    <>
      {targets.map(({ container, props }, index) => (
        <StoreImageGalleryPortal key={`${pageKey}-${index}`} container={container} props={props} />
      ))}
    </>
  );
}
