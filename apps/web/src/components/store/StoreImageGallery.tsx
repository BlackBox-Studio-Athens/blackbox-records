import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

export type StoreGalleryImage = {
  src: string;
  srcSet: string;
  alt: string;
  width: number;
  height: number;
};

export default function StoreImageGallery({ images, title }: { images: StoreGalleryImage[]; title: string }) {
  const [selected, setSelected] = useState(0);
  const [direction, setDirection] = useState(1);
  const reducedMotion = useReducedMotion();
  const image = images[selected]!;
  const select = (index: number) => {
    const next = Math.max(0, Math.min(index, images.length - 1));
    setDirection(next > selected ? 1 : -1);
    setSelected(next);
  };

  return (
    <section
      className="store-image-gallery"
      aria-label={`${title} images`}
      aria-roledescription="carousel"
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        select(selected + (event.key === 'ArrowLeft' ? -1 : 1));
      }}
    >
      <div className="store-image-gallery__stage">
        <AnimatePresence initial={false} mode="popLayout" custom={direction}>
          <motion.img
            key={image.src}
            custom={direction}
            src={image.src}
            srcSet={image.srcSet}
            sizes="(min-width: 768px) 26rem, calc(100vw - 32px)"
            alt={image.alt}
            width={image.width}
            height={image.height}
            fetchPriority={selected === 0 ? 'high' : 'auto'}
            draggable={false}
            className="store-image-gallery__image"
            variants={{
              enter: (travel: number) => ({ opacity: reducedMotion ? 1 : 0, x: reducedMotion ? 0 : travel * 24 }),
              visible: { opacity: 1, x: 0 },
              exit: (travel: number) => ({ opacity: 0, x: reducedMotion ? 0 : travel * -24 }),
            }}
            initial="enter"
            animate="visible"
            exit="exit"
            transition={{ duration: reducedMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
            onPanEnd={(_, info) => {
              if (Math.abs(info.offset.x) > 40 && Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
                select(selected + (info.offset.x < 0 ? 1 : -1));
              }
            }}
          />
        </AnimatePresence>
      </div>
      <div className="store-image-gallery__navigation">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous image"
          disabled={selected === 0}
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
          disabled={selected === images.length - 1}
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
            className="store-image-gallery__thumbnail"
            aria-label={`Show image ${index + 1}: ${item.alt}`}
            aria-pressed={index === selected}
            onClick={() => select(index)}
          >
            <img
              src={item.src}
              srcSet={item.srcSet}
              sizes="72px"
              alt=""
              width={item.width}
              height={item.height}
              loading="lazy"
            />
          </Button>
        ))}
      </div>
    </section>
  );
}
