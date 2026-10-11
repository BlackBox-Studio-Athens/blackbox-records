import type { DistroGroupName } from '@blackbox/content-model';
import cassetteBase from './buy-icons/cassette-base.svg?url&no-inline';
import cassetteSpinLeft from './buy-icons/cassette-spin-left.svg?url&no-inline';
import cassetteSpinRight from './buy-icons/cassette-spin-right.svg?url&no-inline';
import cassetteTop from './buy-icons/cassette-top.svg?url&no-inline';
import cdBase from './buy-icons/cd-base.svg?url&no-inline';
import cdSpin from './buy-icons/cd-spin.svg?url&no-inline';
import cdTop from './buy-icons/cd-top.svg?url&no-inline';
import vinylBase from './buy-icons/vinyl-base.svg?url&no-inline';
import vinylTop from './buy-icons/vinyl-top.svg?url&no-inline';

type BuyIconLayers = { base: string; spins: { src: string; origin: string }[]; top: string };

// Spin origins are the rotate-origin comments in each layer file, as percentages of the 18-unit canvas.
const vinyl: BuyIconLayers = { base: vinylBase, spins: [], top: vinylTop };
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

// Vinyl stays still; CD print and cassette reels turn beneath their stationary light, shell and plus.
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
