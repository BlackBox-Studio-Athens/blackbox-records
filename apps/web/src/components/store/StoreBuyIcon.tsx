import type { DistroGroupName } from '@blackbox/content-model';
import cassetteBase from './buy-icons/cassette-base.svg?url';
import cassetteSpinLeft from './buy-icons/cassette-spin-left.svg?url';
import cassetteSpinRight from './buy-icons/cassette-spin-right.svg?url';
import cassetteTop from './buy-icons/cassette-top.svg?url';
import cdBase from './buy-icons/cd-base.svg?url';
import cdSpin from './buy-icons/cd-spin.svg?url';
import cdTop from './buy-icons/cd-top.svg?url';
import vinylBase from './buy-icons/vinyl-base.svg?url';
import vinylSpin from './buy-icons/vinyl-spin.svg?url';
import vinylTop from './buy-icons/vinyl-top.svg?url';

type BuyIconLayers = { base: string; spins: { src: string; origin: string }[]; top: string };

// Spin origins are the rotate-origin comments in each layer file, as percentages of the 18-unit canvas.
const vinyl: BuyIconLayers = { base: vinylBase, spins: [{ src: vinylSpin, origin: '41.667% 41.667%' }], top: vinylTop };
const cd: BuyIconLayers = { base: cdBase, spins: [{ src: cdSpin, origin: '41.667% 41.667%' }], top: cdTop };
const cassette: BuyIconLayers = {
  base: cassetteBase,
  spins: [
    { src: cassetteSpinLeft, origin: '27.778% 44.444%' },
    { src: cassetteSpinRight, origin: '58.333% 44.444%' },
  ],
  top: cassetteTop,
};

// Clothes and other goods keep the record, the label's own mark.
function layersFor(formatGroup: DistroGroupName | undefined): BuyIconLayers {
  if (formatGroup === 'CDs') return cd;
  if (formatGroup === 'Tapes') return cassette;
  return vinyl;
}

// The format's product in stacked images: light, shell and plus stay still while the print or reels turn.
// Images keep each layer's gradient ids private to its own document, so every card can repeat them.
export default function StoreBuyIcon({ formatGroup }: { formatGroup?: DistroGroupName }) {
  const { base, spins, top } = layersFor(formatGroup);
  return (
    <span className="store-buy-icon" aria-hidden="true">
      <img src={base} alt="" width={18} height={18} />
      {spins.map(({ src, origin }) => (
        <img
          key={src}
          className="store-buy-icon__spin"
          src={src}
          alt=""
          width={18}
          height={18}
          style={{ transformOrigin: origin }}
        />
      ))}
      <img src={top} alt="" width={18} height={18} />
    </span>
  );
}
