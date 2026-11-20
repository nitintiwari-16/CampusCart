import {useState} from 'react';
import type {ArtworkKind} from '../data/catalog';

interface ProductArtworkProps {
  kind: ArtworkKind;
  title: string;
  imageUrl?: string;
  imageFocus?: 'object-center' | 'object-left' | 'object-right';
}

export function ProductArtwork({
  kind,
  title,
  imageUrl,
  imageFocus = 'object-center',
}: ProductArtworkProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (imageUrl && !imgFailed) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#F4F0E8]">
        <img
          src={imageUrl}
          alt={title}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgFailed(true)}
          className={`h-full w-full object-cover ${imageFocus} transition-transform duration-300 ease-out group-hover:scale-[1.04]`}
        />
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#F4F0E8] p-6"
      role="img"
      aria-label={title}
    >
      <svg
        viewBox="0 0 240 180"
        className="h-full w-full max-w-[196px] transition-transform duration-200 ease-out group-hover:scale-[1.03]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="120" cy="154" rx="68" ry="8" fill="#E3DDD2" />
        <rect x="64" y="42" width="112" height="96" rx="8" fill="#FFFFFF" stroke="#D5CEC2" strokeWidth="2" />
        <text x="120" y="96" textAnchor="middle" fill="#141414" fontSize="11" fontWeight="600" fontFamily="sans-serif">
          {kind.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
