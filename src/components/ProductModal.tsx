import {Check, Minus, Plus, Star, X} from 'lucide-react';
import type {Product} from '../data/catalog';
import {ProductArtwork} from './ProductArtwork';

interface ProductModalProps {
  product: Product | null;
  quantity: number;
  onClose: () => void;
  onAdd: (product: Product) => void;
  onUpdateQty: (productId: string, delta: number) => void;
}

export function ProductModal({
  product,
  quantity,
  onClose,
  onAdd,
  onUpdateQty,
}: ProductModalProps) {
  if (!product) return null;

  const discountPct = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative grid w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E6E1D8] bg-[#FAF8F5] shadow-2xl md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={product.name}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close product details"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#E6E1D8] bg-white/95 text-[#141414] transition-colors hover:bg-white hover:text-[#9E1B32]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="aspect-[4/3] w-full bg-[#F4F0E8] md:aspect-auto md:h-full">
          <ProductArtwork
            kind={product.artwork}
            title={product.name}
            imageUrl={product.imageUrl}
            imageFocus={product.imageFocus}
          />
        </div>

        <div className="flex flex-col justify-between bg-white p-6">
          <div>
            <div className="flex items-center justify-between pr-8 text-xs text-[#5A564E]">
              <span>
                {product.categoryLabel} · {product.unitLabel}
              </span>
              <span className="inline-flex items-center gap-1 font-mono font-medium text-[#141414] tabular-nums">
                <Star className="h-3.5 w-3.5 fill-[#B08D57] text-[#B08D57]" />
                {product.rating.toFixed(1)}
              </span>
            </div>

            <h3 className="mt-2 font-display text-2xl font-semibold text-[#141414]">
              {product.name}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5A564E]">
              {product.description}
            </p>

            <div className="mt-5 border-t border-[#EFEBE3] pt-4">
              <p className="text-xs font-semibold text-[#141414]">What&apos;s Included</p>
              <ul className="mt-2.5 space-y-2">
                {product.highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-[#5A564E]">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#15803D]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-[#EFEBE3] pt-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xl font-semibold text-[#141414] tabular-nums">
                  ₹{product.price}
                </span>
                <span className="font-mono text-xs text-[#9C9588] line-through tabular-nums">
                  ₹{product.mrp}
                </span>
                <span className="text-xs font-semibold text-[#15803D]">
                  {discountPct}% off
                </span>
              </div>
              <span className="block text-[11px] text-[#5A564E]">
                {product.ordersCount} · {product.availability}
              </span>
            </div>

            {quantity === 0 ? (
              <button
                type="button"
                onClick={() => onAdd(product)}
                className="rounded-lg bg-[#9E1B32] px-5 py-2.5 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#7F1528]"
              >
                Add to Bag
              </button>
            ) : (
              <div className="flex items-center rounded-lg bg-[#9E1B32] text-white">
                <button
                  type="button"
                  onClick={() => onUpdateQty(product.id, -1)}
                  aria-label="Decrease quantity"
                  className="flex h-9 w-9 items-center justify-center rounded-l-lg hover:bg-[#7F1528]"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-mono text-sm font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQty(product.id, 1)}
                  aria-label="Increase quantity"
                  className="flex h-9 w-9 items-center justify-center rounded-r-lg hover:bg-[#7F1528]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
