import {useState} from 'react';
import type {User} from 'firebase/auth';
import {Check, Copy, Minus, Plus, ShoppingBag, Trash2, X} from 'lucide-react';
import {
  DELIVERY_SLOTS,
  HOSTEL_BLOCKS,
  type CartItem,
  type HostelOrder,
} from '../data/catalog';
import type {StudentProfile} from '../lib/firebase';
import {GoogleAuthButton} from './GoogleAuthButton';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  orders: HostelOrder[];
  onPlaceOrder: (payload: {
    customerName: string;
    phone: string;
    hostelBlock: string;
    roomNumber: string;
    slot: string;
    paymentMethod: 'UPI' | 'Cash on Delivery';
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
  }) => Promise<HostelOrder>;
  onCancelOrder?: (orderId: string) => Promise<void>;
  initialTab?: 'cart' | 'orders';
  selectedHostel: string;
  selectedSlot: string;
  user: User | null;
  profile: StudentProfile | null;
  authLoading: boolean;
  authError?: string;
  onGoogleSignIn: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  orders,
  onPlaceOrder,
  onCancelOrder,
  initialTab = 'cart',
  selectedHostel,
  selectedSlot,
  user,
  profile,
  authLoading,
  authError,
  onGoogleSignIn,
}: CartDrawerProps) {
  const [activeTab, setActiveTab] = useState<'cart' | 'orders'>(initialTab);
  const [studentName, setStudentName] = useState(
    profile?.displayName || user?.displayName || ''
  );
  const [phone, setPhone] = useState(profile?.phone || '');
  const [hostelBlock, setHostelBlock] = useState(
    profile?.defaultHostelBlock || selectedHostel
  );
  const [roomNumber, setRoomNumber] = useState(profile?.defaultRoomNumber || '');
  const [slot, setSlot] = useState(selectedSlot);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash on Delivery'>('UPI');
  const [applyDgu50, setApplyDgu50] = useState(true);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<HostelOrder | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const mrpTotal = items.reduce((sum, item) => sum + item.product.mrp * item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const catalogSavings = Math.max(0, mrpTotal - subtotal);
  const canApplyFirstOrder = subtotal >= 149;
  const discount = applyDgu50 && canApplyFirstOrder ? 50 : 0;
  const deliveryFee = subtotal >= 149 || subtotal === 0 ? 0 : 15;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const buildOrderSummary = (order: HostelOrder) => {
    const lines = order.items.map(
      (i) => `- ${i.name} x${i.quantity} (₹${i.price * i.quantity})`
    );
    return [
      `CampusCart Order #${order.id}`,
      `Name: ${order.customerName}`,
      `Hostel: ${order.hostelBlock}, Room ${order.roomNumber}`,
      `Slot: ${order.slot}`,
      `Payment: ${order.paymentMethod}`,
      ``,
      `Items:`,
      ...lines,
      ``,
      `Total Payable: ₹${order.total}${order.discount > 0 ? ` (incl. ₹${order.discount} DGU50 discount)` : ''}`,
    ].join('\n');
  };

  const handleCopyMessage = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || submitting) return;
    if (!studentName.trim() || !phone.trim() || !roomNumber.trim()) {
      setFormError('Please enter your name, mobile number, and hostel room number.');
      return;
    }

    setFormError('');
    setSubmitting(true);
    try {
      const created = await onPlaceOrder({
        customerName: studentName.trim(),
        phone: phone.trim(),
        hostelBlock,
        roomNumber: roomNumber.trim(),
        slot,
        paymentMethod,
        subtotal,
        discount,
        deliveryFee,
        total,
      });
      onClearCart();
      setConfirmedOrder(created);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to place order right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[2px]">
      <div
        className="flex h-full w-full max-w-md flex-col bg-[#FAF8F5] shadow-2xl"
        role="dialog"
        aria-label="CampusCart Bag and Checkout"
      >
        <div className="flex items-center justify-between border-b border-[#E6E1D8] bg-white px-5 py-4">
          <div className="flex items-center gap-1 rounded-lg bg-[#F4F0E8] p-1">
            <button
              type="button"
              onClick={() => {
                setConfirmedOrder(null);
                setActiveTab('cart');
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'cart'
                  ? 'bg-white text-[#141414] shadow-sm'
                  : 'text-[#5A564E] hover:text-[#141414]'
              }`}
            >
              Bag ({items.reduce((s, i) => s + i.quantity, 0)})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'orders'
                  ? 'bg-white text-[#141414] shadow-sm'
                  : 'text-[#5A564E] hover:text-[#141414]'
              }`}
            >
              Orders ({orders.length})
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5A564E] transition-colors hover:bg-[#F4F0E8] hover:text-[#141414]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {activeTab === 'orders' ? (
            <div className="space-y-4">
              {!user && (
                <div className="rounded-xl border border-[#E6E1D8] bg-white p-4 space-y-3">
                  <p className="text-xs font-medium text-[#5A564E]">
                    Sign in with Google to sync your hostel orders and delivery room across devices.
                  </p>
                  <GoogleAuthButton
                    onClick={onGoogleSignIn}
                    loading={authLoading}
                    compact
                  />
                  {authError && (
                    <p className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-[#9E1B32]">
                      {authError}
                    </p>
                  )}
                </div>
              )}

              {orders.length === 0 ? (
                <div className="rounded-xl border border-[#E6E1D8] bg-white p-8 text-center">
                  <p className="font-display text-lg font-semibold text-[#141414]">
                    No orders yet
                  </p>
                  <p className="mt-1 text-xs text-[#5A564E]">
                    Your confirmed DGU hostel orders will appear here.
                  </p>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-[#E6E1D8] bg-white p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-[#141414] tabular-nums">
                        Order #{order.id}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          order.status.includes('Cancelled')
                            ? 'text-[#9E1B32]'
                            : 'text-[#15803D]'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#5A564E]">
                      {order.hostelBlock} · Room {order.roomNumber} · {order.slot}
                    </p>
                    <ul className="space-y-1 border-t border-[#EFEBE3] pt-2 text-xs text-[#141414]">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between gap-2">
                          <span className="truncate">
                            {item.name}
                            {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                          </span>
                          {item.price > 0 && (
                            <span className="font-mono shrink-0 tabular-nums">
                              ₹{item.price * item.quantity}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between border-t border-[#EFEBE3] pt-2 text-sm font-semibold text-[#141414]">
                      <span>{order.paymentMethod}</span>
                      <span className="font-mono tabular-nums">₹{order.total}</span>
                    </div>
                    {onCancelOrder && order.status === 'Confirmed' && order.docId && (
                      <div className="pt-1 text-right">
                        <button
                          type="button"
                          onClick={() => onCancelOrder(order.docId!)}
                          className="text-xs font-medium text-[#9E1B32] hover:underline underline-offset-4"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : confirmedOrder ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-200 bg-white p-5">
                <div className="flex items-center gap-2 text-[#15803D]">
                  <Check className="h-5 w-5 shrink-0" />
                  <h3 className="font-display text-lg font-semibold">
                    Order #{confirmedOrder.id} Confirmed
                  </h3>
                </div>
                <p className="mt-1.5 text-sm text-[#5A564E]">
                  Scheduled for <strong className="text-[#141414]">{confirmedOrder.slot}</strong> to{' '}
                  {confirmedOrder.hostelBlock}, Room {confirmedOrder.roomNumber}.
                </p>
              </div>

              <div className="rounded-xl border border-[#E6E1D8] bg-white p-4 space-y-2 text-sm">
                <div className="flex justify-between text-[#5A564E]">
                  <span>Student</span>
                  <span className="font-medium text-[#141414]">
                    {confirmedOrder.customerName}
                  </span>
                </div>
                <div className="flex justify-between text-[#5A564E]">
                  <span>Payment Method</span>
                  <span className="font-medium text-[#141414]">
                    {confirmedOrder.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between text-[#5A564E]">
                  <span>Total Payable</span>
                  <span className="font-mono font-semibold text-[#141414] tabular-nums">
                    ₹{confirmedOrder.total}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() =>
                    handleCopyMessage(buildOrderSummary(confirmedOrder), confirmedOrder.id)
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E6E1D8] bg-white px-4 py-2.5 text-sm font-medium text-[#141414] transition-colors hover:bg-[#F4F0E8]"
                >
                  <Copy className="h-4 w-4" />
                  <span>
                    {copiedId === confirmedOrder.id ? 'Copied Order Summary' : 'Copy Order Receipt'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="flex w-full items-center justify-center rounded-lg bg-[#9E1B32] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#7F1528]"
                >
                  View in My Orders
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#E6E1D8] bg-white text-[#9E1B32]">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-[#141414]">
                Your bag is empty
              </h3>
              <p className="mt-1.5 max-w-[260px] text-sm text-[#5A564E]">
                Add ₹149+ of campus essentials to unlock complimentary hostel delivery and ₹50 off with DGU50.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 rounded-lg bg-[#141414] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#9E1B32]"
              >
                Explore Essentials
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {!user && (
                <div className="rounded-xl border border-[#E6E1D8] bg-white px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#141414]">
                        Save orders to your account
                      </p>
                      <p className="text-[11px] text-[#5A564E]">
                        Auto-fill hostel details with Google
                      </p>
                    </div>
                    <GoogleAuthButton
                      onClick={onGoogleSignIn}
                      loading={authLoading}
                      label="Sign in"
                      compact
                    />
                  </div>
                  {authError && (
                    <p className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-[#9E1B32]">
                      {authError}
                    </p>
                  )}
                </div>
              )}

              {(catalogSavings > 0 || discount > 0) && (
                <div className="rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-xs font-medium text-[#15803D]">
                  Total savings on this bag: ₹{catalogSavings + discount}
                </div>
              )}

              <div className="rounded-xl border border-[#E6E1D8] bg-white p-4 space-y-3">
                {items.map(({product, quantity}) => (
                  <div
                    key={product.id}
                    className="flex items-start justify-between gap-3 border-b border-[#EFEBE3] pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#141414]">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[#5A564E]">
                        {product.unitLabel} ·{' '}
                        <span className="font-mono font-medium text-[#141414] tabular-nums">
                          ₹{product.price}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center rounded-lg border border-[#E6E1D8] bg-[#FAF8F5]">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(product.id, -1)}
                          aria-label={`Decrease quantity of ${product.name}`}
                          className="flex h-7 w-7 items-center justify-center text-[#141414] hover:text-[#9E1B32]"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center font-mono text-xs font-semibold tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(product.id, 1)}
                          aria-label={`Increase quantity of ${product.name}`}
                          className="flex h-7 w-7 items-center justify-center text-[#141414] hover:text-[#9E1B32]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(product.id)}
                        aria-label={`Remove ${product.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8A8377] hover:bg-[#FAF8F5] hover:text-[#9E1B32]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-[#E6E1D8] bg-white p-4 space-y-2.5 text-sm">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-semibold text-[#141414]">Apply code DGU50</span>
                    <span className="block text-xs text-[#5A564E]">
                      ₹50 off first basket (min. ₹149)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={applyDgu50 && canApplyFirstOrder}
                    disabled={!canApplyFirstOrder}
                    onChange={(e) => setApplyDgu50(e.target.checked)}
                    className="h-4 w-4 rounded border-[#D5CEC2] text-[#9E1B32] focus:ring-[#9E1B32]"
                  />
                </label>

                <div className="border-t border-[#EFEBE3] pt-2.5 space-y-1.5 text-xs text-[#5A564E]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums">₹{subtotal}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between font-medium text-[#15803D]">
                      <span>First-Order Privilege (DGU50)</span>
                      <span className="font-mono tabular-nums">-₹{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Hostel Concierge Delivery</span>
                    <span className="font-mono tabular-nums">
                      {deliveryFee === 0 ? 'Complimentary' : `₹${deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[#EFEBE3] pt-2 text-sm font-semibold text-[#141414]">
                    <span>Total Payable</span>
                    <span className="font-mono tabular-nums">₹{total}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5 rounded-xl border border-[#E6E1D8] bg-white p-4">
                <h4 className="font-display text-base font-semibold text-[#141414]">
                  Hostel Delivery Details
                </h4>

                {formError && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-[#9E1B32]">
                    {formError}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#5A564E]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Aarav Verma"
                      className="w-full rounded-lg border border-[#E6E1D8] bg-[#FAF8F5] px-3 py-2 text-sm text-[#141414] focus:border-[#9E1B32] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#5A564E]">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full rounded-lg border border-[#E6E1D8] bg-[#FAF8F5] px-3 py-2 text-sm text-[#141414] focus:border-[#9E1B32] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium text-[#5A564E]">
                      Hostel / PG
                    </label>
                    <select
                      value={hostelBlock}
                      onChange={(e) => setHostelBlock(e.target.value)}
                      className="w-full rounded-lg border border-[#E6E1D8] bg-[#FAF8F5] px-3 py-2 text-sm text-[#141414] focus:border-[#9E1B32] focus:bg-white focus:outline-none"
                    >
                      {HOSTEL_BLOCKS.map((block) => (
                        <option key={block} value={block}>
                          {block}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#5A564E]">
                      Room No.
                    </label>
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="204"
                      className="w-full rounded-lg border border-[#E6E1D8] bg-[#FAF8F5] px-3 py-2 text-sm text-[#141414] focus:border-[#9E1B32] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#5A564E]">
                    Evening Slot
                  </label>
                  <select
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    className="w-full rounded-lg border border-[#E6E1D8] bg-[#FAF8F5] px-3 py-2 text-sm text-[#141414] focus:border-[#9E1B32] focus:bg-white focus:outline-none"
                  >
                    {DELIVERY_SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="mb-1.5 block text-xs font-medium text-[#5A564E]">
                    Payment Preference
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['UPI', 'Cash on Delivery'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                          paymentMethod === method
                            ? 'border-[#9E1B32] bg-[#9E1B32]/5 text-[#9E1B32]'
                            : 'border-[#E6E1D8] bg-[#FAF8F5] text-[#5A564E] hover:bg-white'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-[#9E1B32] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#7F1528] disabled:opacity-60"
                >
                  {submitting ? 'Confirming Order...' : `Place Hostel Order · ₹${total}`}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
