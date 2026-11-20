import {useEffect, useMemo, useState} from 'react';
import {onAuthStateChanged, type User} from 'firebase/auth';
import {
  ArrowRight,
  BookOpen,
  Clock,
  Coffee,
  Laptop,
  LayoutGrid,
  LogOut,
  MapPin,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import {CartDrawer} from './components/CartDrawer';
import {GoogleAuthButton} from './components/GoogleAuthButton';
import {ProductArtwork} from './components/ProductArtwork';
import {ProductModal} from './components/ProductModal';
import {
  CATEGORIES,
  DELIVERY_SLOTS,
  HERO_IMAGE_URL,
  HOSTEL_BLOCKS,
  PRODUCTS,
  type CartItem,
  type HostelOrder,
  type Product,
  type ProductCategory,
} from './data/catalog';
import {
  auth,
  cancelFirestoreOrder,
  createFirestoreOrder,
  formatGoogleAuthError,
  loadStudentProfile,
  saveStudentProfile,
  signInWithGoogle,
  signOutUser,
  subscribeUserOrders,
  type FirestoreOrderRecord,
  type StudentProfile,
} from './lib/firebase';

const ORDERS_STORAGE_KEY = 'campuscart_dgu_orders_v1';

type SortOption = 'recommended' | 'rating' | 'price-asc' | 'savings';

function mapFirestoreOrder(record: FirestoreOrderRecord): HostelOrder {
  return {
    id: record.orderCode,
    docId: record.docId,
    createdAt: new Date(record.createdAtMs).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    customerName: record.customerName,
    phone: record.phone,
    hostelBlock: record.hostelBlock,
    roomNumber: record.roomNumber,
    slot: record.slot,
    paymentMethod: record.paymentMethod,
    items: record.itemLines.map((line) => ({
      name: line,
      quantity: 1,
      price: 0,
    })),
    subtotal: record.subtotal,
    discount: record.discount,
    deliveryFee: record.deliveryFee,
    total: record.total,
    status: record.status,
  };
}

export default function App() {
  const [bannerVisible, setBannerVisible] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | ProductCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHostel, setSelectedHostel] = useState(HOSTEL_BLOCKS[0]);
  const [selectedSlot, setSelectedSlot] = useState(DELIVERY_SLOTS[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'cart' | 'orders'>('cart');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // Firebase Auth & Firestore State
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuggestNewTab, setAuthSuggestNewTab] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [cloudOrders, setCloudOrders] = useState<HostelOrder[]>([]);
  const [guestOrders, setGuestOrders] = useState<HostelOrder[]>(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as HostelOrder[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(guestOrders));
    } catch {
      // Ignore storage quota errors
    }
  }, [guestOrders]);

  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);

      if (unsubscribeOrders) {
        unsubscribeOrders();
        unsubscribeOrders = undefined;
      }

      if (!nextUser) {
        setProfile(null);
        setCloudOrders([]);
        return;
      }

      try {
        const existingProfile = await loadStudentProfile(nextUser.uid);
        if (existingProfile) {
          setProfile(existingProfile);
          if (existingProfile.defaultHostelBlock) {
            setSelectedHostel(existingProfile.defaultHostelBlock);
          }
        } else {
          const initialProfile: StudentProfile = {
            uid: nextUser.uid,
            displayName: nextUser.displayName || 'DGU Student',
            email: nextUser.email || 'student@dgu.ac.in',
          };
          await saveStudentProfile(initialProfile);
          setProfile(initialProfile);
        }
      } catch {
        // Structured error already logged inside firebase.ts
      }

      unsubscribeOrders = subscribeUserOrders(
        nextUser.uid,
        (records) => {
          setCloudOrders(records.map(mapFirestoreOrder));
        },
        () => {
          // Handled cleanly via structured error logger
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, []);

  const orders = user ? cloudOrders : guestOrders;

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = PRODUCTS.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;
      const matchesQuery =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.categoryLabel.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });

    if (sortBy === 'rating') {
      return [...list].sort((a, b) => b.rating - a.rating);
    }
    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'savings') {
      return [...list].sort((a, b) => b.mrp - b.price - (a.mrp - a.price));
    }
    return list;
  }, [selectedCategory, searchQuery, sortBy]);

  const getQty = (productId: string) =>
    cart.find((item) => item.product.id === productId)?.quantity ?? 0;

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? {...i, quantity: i.quantity + 1} : i
        );
      }
      return [...prev, {product, quantity: 1}];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? {...i, quantity: i.quantity + delta} : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthSuggestNewTab(false);
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const formatted = formatGoogleAuthError(err);
      console.error('Google Sign-In error:', formatted.code, err);
      if (formatted.message) {
        setAuthError(formatted.message);
        setAuthSuggestNewTab(Boolean(formatted.suggestNewTab));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
  };

  const handlePlaceOrder = async (payload: {
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
  }): Promise<HostelOrder> => {
    const orderCode = `CC-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderItems = cart.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      price: i.product.price,
    }));

    if (user) {
      const itemLines = cart.map(
        (i) => `${i.product.name} x${i.quantity} (₹${i.product.price * i.quantity})`
      );
      const docId = await createFirestoreOrder({
        userId: user.uid,
        orderCode,
        customerName: payload.customerName,
        phone: payload.phone,
        hostelBlock: payload.hostelBlock,
        roomNumber: payload.roomNumber,
        slot: payload.slot,
        paymentMethod: payload.paymentMethod,
        itemLines,
        subtotal: payload.subtotal,
        discount: payload.discount,
        deliveryFee: payload.deliveryFee,
        total: payload.total,
      });

      const updatedProfile: StudentProfile = {
        uid: user.uid,
        displayName: payload.customerName,
        email: user.email || profile?.email || 'student@dgu.ac.in',
        phone: payload.phone,
        defaultHostelBlock: payload.hostelBlock,
        defaultRoomNumber: payload.roomNumber,
      };
      await saveStudentProfile(updatedProfile);
      setProfile(updatedProfile);

      return {
        id: orderCode,
        docId,
        createdAt: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
        customerName: payload.customerName,
        phone: payload.phone,
        hostelBlock: payload.hostelBlock,
        roomNumber: payload.roomNumber,
        slot: payload.slot,
        paymentMethod: payload.paymentMethod,
        items: orderItems,
        subtotal: payload.subtotal,
        discount: payload.discount,
        deliveryFee: payload.deliveryFee,
        total: payload.total,
        status: 'Confirmed',
      };
    }

    const guestOrder: HostelOrder = {
      id: orderCode,
      createdAt: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
      customerName: payload.customerName,
      phone: payload.phone,
      hostelBlock: payload.hostelBlock,
      roomNumber: payload.roomNumber,
      slot: payload.slot,
      paymentMethod: payload.paymentMethod,
      items: orderItems,
      subtotal: payload.subtotal,
      discount: payload.discount,
      deliveryFee: payload.deliveryFee,
      total: payload.total,
      status: 'Confirmed',
    };
    setGuestOrders((prev) => [guestOrder, ...prev]);
    return guestOrder;
  };

  const handleCancelOrder = async (orderDocId: string) => {
    if (!user) return;
    await cancelFirestoreOrder(orderDocId);
  };

  const openBagDrawer = (tab: 'cart' | 'orders' = 'cart') => {
    setDrawerTab(tab);
    setDrawerOpen(true);
  };

  const renderCategoryIcon = (id: 'all' | ProductCategory) => {
    const cls = 'h-4 w-4';
    switch (id) {
      case 'all':
        return <LayoutGrid className={cls} />;
      case 'baskets':
        return <Package className={cls} />;
      case 'stationery':
        return <BookOpen className={cls} />;
      case 'snacks':
        return <Coffee className={cls} />;
      case 'care':
        return <Sparkles className={cls} />;
      case 'tech':
        return <Laptop className={cls} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#141414]">
      {/* Slim Dismissible Editorial Announcement Strip (<= 36px) */}
      {bannerVisible && (
        <div className="bg-[#141414] text-[#FAF8F5]">
          <div className="mx-auto flex h-9 max-w-[1200px] items-center justify-between px-4 text-xs sm:px-6">
            <p className="truncate">
              First order at DGU? Apply <span className="font-mono font-semibold text-[#D6B47C]">DGU50</span> for ₹50 off ₹149+ baskets · Complimentary hostel drop 7:00–9:00 PM
            </p>
            <button
              type="button"
              onClick={() => setBannerVisible(false)}
              aria-label="Dismiss announcement"
              className="ml-4 shrink-0 text-[#A8A297] transition-colors hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-[#E6E1D8] bg-[#FAF8F5]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-4 py-4 sm:px-6">
          <a
            href="#"
            className="font-display text-2xl font-bold tracking-tight text-[#141414] whitespace-nowrap shrink-0"
          >
            CampusCart
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5A564E]">
            <a
              href="#baskets"
              onClick={() => setSelectedCategory('baskets')}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#141414] hover:underline hover:underline-offset-4"
            >
              Baskets
            </a>
            <a
              href="#catalog"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#141414] hover:underline hover:underline-offset-4"
            >
              Catalog
            </a>
            <a
              href="#delivery"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#141414] hover:underline hover:underline-offset-4"
            >
              Delivery
            </a>
            <button
              type="button"
              onClick={() => openBagDrawer('orders')}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#141414] hover:underline hover:underline-offset-4"
            >
              My Orders
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => openBagDrawer('cart')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#9E1B32] px-4 py-2 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#7F1528]"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="tabular-nums">
                {totalItems > 0 ? `Bag (${totalItems}) · ₹${cartSubtotal}` : 'Bag (0)'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="pb-20">
        {/* Boutique Storefront Utility Bar: Hostel Location, Slot, Search, & Google Account */}
        <section className="border-b border-[#E6E1D8] bg-white">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:divide-x sm:divide-[#E6E1D8] rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] px-3 py-2">
              <div className="flex items-center gap-2 pr-2">
                <MapPin className="h-4 w-4 shrink-0 text-[#9E1B32]" />
                <select
                  aria-label="Select Hostel Location"
                  value={selectedHostel}
                  onChange={(e) => setSelectedHostel(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-[#141414] focus:outline-none sm:w-auto"
                >
                  {HOSTEL_BLOCKS.map((block) => (
                    <option key={block} value={block}>
                      {block}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 sm:pl-3">
                <Clock className="h-4 w-4 shrink-0 text-[#B08D57]" />
                <select
                  aria-label="Select Evening Delivery Slot"
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium text-[#5A564E] focus:outline-none sm:w-auto"
                >
                  {DELIVERY_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:w-64 lg:w-72">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#8A8377]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search registers, coffee, cables..."
                  className="w-full rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] py-2 pr-3.5 pl-10 text-sm text-[#141414] placeholder:text-[#8A8377] focus:border-[#9E1B32] focus:bg-white focus:outline-none"
                />
              </div>

              {!authReady ? (
                <div className="h-9 w-36 rounded-lg bg-[#F4F0E8]" />
              ) : user ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] px-3 py-1.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'Student profile'}
                        referrerPolicy="no-referrer"
                        className="h-7 w-7 rounded-full object-cover border border-[#E6E1D8] shrink-0"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#141414] text-xs font-semibold text-white shrink-0">
                        {(user.displayName || 'D')[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#141414] max-w-[130px]">
                        {user.displayName || 'DGU Student'}
                      </p>
                      <p className="truncate text-[10px] text-[#5A564E] max-w-[130px]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    aria-label="Sign out"
                    title="Sign out"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#5A564E] transition-colors hover:bg-white hover:text-[#9E1B32]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <GoogleAuthButton
                  onClick={handleGoogleSignIn}
                  loading={authLoading}
                  compact
                />
              )}
            </div>
          </div>

          {authError && (
            <div className="mx-auto max-w-[1200px] px-4 pb-3 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-[#9E1B32]">
                <span>{authError}</span>
                <div className="flex items-center gap-3 shrink-0">
                  {authSuggestNewTab && typeof window !== 'undefined' && (
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 font-semibold hover:text-[#7F1528]"
                    >
                      Open in full browser tab
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError('');
                      setAuthSuggestNewTab(false);
                    }}
                    aria-label="Dismiss sign-in error"
                    className="text-[#9E1B32]/80 hover:text-[#9E1B32]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Editorial Luxury Storefront Hero with Studio Lifestyle Photography */}
        <section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6 lg:pt-10">
          <div className="grid items-stretch gap-6 lg:grid-cols-12">
            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#141414] p-8 text-[#FAF8F5] lg:col-span-7 lg:p-10">
              <img
                src={HERO_IMAGE_URL}
                alt="Curated DGU campus study essentials on a limestone desk"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover opacity-65"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/95 via-[#141414]/80 to-[#141414]/40" />

              <div className="relative z-10">
                <p className="text-xs font-medium tracking-wide text-[#E5C896]">
                  DGU Campus Concierge · Evening Hostel Delivery
                </p>
                <h1 className="mt-4 max-w-xl text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl leading-[1.08]">
                  Thoughtfully curated essentials, delivered to your hostel door.
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#E6E1D8] sm:text-base">
                  Skip scattered outside markets. Order exam stationery, artisan coffee, late-night snacks, personal care, and USB-C accessories with ₹50 off your first ₹150 basket and punctual 7:00–9:00 PM drops.
                </p>
              </div>

              <div className="relative z-10 mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#catalog"
                  onClick={() => setSelectedCategory('baskets')}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#9E1B32] px-5 py-3 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#7F1528]"
                >
                  <span>Explore ₹150 Baskets</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#delivery"
                  className="inline-flex items-center rounded-lg border border-white/30 bg-black/30 px-5 py-3 text-sm font-medium text-[#FAF8F5] backdrop-blur-xs whitespace-nowrap shrink-0 transition-colors hover:bg-black/50"
                >
                  How Delivery Works
                </a>
              </div>
            </div>

            {/* Right Featured Signature Basket Card */}
            {(() => {
              const featured = PRODUCTS[0];
              const featuredDiscount = Math.round(
                ((featured.mrp - featured.price) / featured.mrp) * 100
              );
              const featuredQty = getQty(featured.id);
              return (
                <div className="flex flex-col justify-between rounded-2xl border border-[#E6E1D8] bg-white p-6 lg:col-span-5 lg:p-7">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#5A564E]">
                      <span className="font-medium text-[#9E1B32]">Signature Selection</span>
                      <span className="inline-flex items-center gap-1 font-mono font-medium text-[#141414] tabular-nums">
                        <Star className="h-3.5 w-3.5 fill-[#B08D57] text-[#B08D57]" />
                        {featured.rating.toFixed(1)} · {featured.ordersCount}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveProduct(featured)}
                      className="mt-2 block text-left font-display text-2xl font-semibold text-[#141414] hover:text-[#9E1B32] transition-colors"
                    >
                      {featured.name}
                    </button>
                    <p className="mt-1 text-sm text-[#5A564E]">
                      {featured.description}
                    </p>

                    <button
                      type="button"
                      onClick={() => setActiveProduct(featured)}
                      className="mt-4 block w-full aspect-[16/9] overflow-hidden rounded-xl border border-[#EFEBE3] group"
                    >
                      <ProductArtwork
                        kind={featured.artwork}
                        title={featured.name}
                        imageUrl={featured.imageUrl}
                        imageFocus={featured.imageFocus}
                      />
                    </button>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#EFEBE3] pt-4">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-xl font-semibold text-[#141414] tabular-nums">
                          ₹{featured.price}
                        </span>
                        <span className="font-mono text-xs text-[#9C9588] line-through tabular-nums">
                          ₹{featured.mrp}
                        </span>
                        <span className="text-xs font-semibold text-[#15803D]">
                          {featuredDiscount}% off
                        </span>
                      </div>
                      <span className="block text-xs text-[#5A564E]">
                        ₹{Math.max(0, featured.price - 50)} on first order with DGU50
                      </span>
                    </div>

                    {featuredQty === 0 ? (
                      <button
                        type="button"
                        onClick={() => addToCart(featured)}
                        className="rounded-lg border border-[#141414] bg-[#141414] px-5 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:border-[#9E1B32] hover:bg-[#9E1B32]"
                      >
                        Add to Bag
                      </button>
                    ) : (
                      <div className="flex items-center rounded-lg bg-[#9E1B32] text-white">
                        <button
                          type="button"
                          onClick={() => updateQty(featured.id, -1)}
                          aria-label="Decrease quantity"
                          className="flex h-9 w-9 items-center justify-center rounded-l-lg hover:bg-[#7F1528]"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-7 text-center font-mono text-sm font-semibold tabular-nums">
                          {featuredQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(featured.id, 1)}
                          aria-label="Increase quantity"
                          className="flex h-9 w-9 items-center justify-center rounded-r-lg hover:bg-[#7F1528]"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 4-Column Storefront Metrics Strip */}
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-[#E6E1D8] bg-white px-5 py-4">
              <p className="font-mono text-base font-semibold text-[#141414] tabular-nums">
                7:00–9:00 PM
              </p>
              <p className="mt-0.5 text-xs text-[#5A564E]">Punctual Hostel Delivery</p>
            </div>
            <div className="rounded-xl border border-[#E6E1D8] bg-white px-5 py-4">
              <p className="font-mono text-base font-semibold text-[#141414] tabular-nums">
                Complimentary
              </p>
              <p className="mt-0.5 text-xs text-[#5A564E]">Delivery on baskets ₹149+</p>
            </div>
            <div className="rounded-xl border border-[#E6E1D8] bg-white px-5 py-4">
              <p className="font-mono text-base font-semibold text-[#9E1B32] tabular-nums">
                ₹50 Privilege
              </p>
              <p className="mt-0.5 text-xs text-[#5A564E]">First order · Code DGU50</p>
            </div>
            <div className="rounded-xl border border-[#E6E1D8] bg-white px-5 py-4">
              <p className="font-mono text-base font-semibold text-[#141414] tabular-nums">
                {PRODUCTS.length} Essentials
              </p>
              <p className="mt-0.5 text-xs text-[#5A564E]">Verified student pricing</p>
            </div>
          </div>
        </section>

        {/* Curated Catalog Section */}
        <section
          id="catalog"
          className="mx-auto max-w-[1200px] px-4 pt-12 pb-8 sm:px-6"
        >
          <div id="baskets" className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-[#141414]">
                The Campus Collection
              </h2>
              <p className="mt-1 text-sm text-[#5A564E]">
                Click any item for pack details · Delivering to {selectedHostel}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#E6E1D8] bg-white p-1">
              {(
                [
                  {id: 'recommended', label: 'Curated'},
                  {id: 'rating', label: 'Top Rated'},
                  {id: 'price-asc', label: 'Price: Low–High'},
                  {id: 'savings', label: 'Highest Savings'},
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSortBy(option.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    sortBy === option.id
                      ? 'bg-[#141414] text-white'
                      : 'text-[#5A564E] hover:bg-[#FAF8F5] hover:text-[#141414]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 6-Tile Visual Category Strip */}
          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3.5 text-center transition-colors ${
                    active
                      ? 'border-[#9E1B32] bg-white text-[#9E1B32] shadow-xs'
                      : 'border-[#E6E1D8] bg-white text-[#5A564E] hover:border-[#C6BEB0] hover:text-[#141414]'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      active ? 'bg-[#9E1B32] text-white' : 'bg-[#F4F0E8] text-[#141414]'
                    }`}
                  >
                    {renderCategoryIcon(cat.id)}
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap truncate max-w-full">
                    {cat.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 3-Column Boutique Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-[#E6E1D8] bg-white p-10 text-center">
              <p className="font-display text-lg font-semibold text-[#141414]">
                No essentials match &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="mt-1 text-sm text-[#5A564E]">
                Try another search term or reset filters to browse all campus essentials.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 rounded-lg border border-[#E6E1D8] px-4 py-2 text-xs font-medium text-[#141414] hover:bg-[#FAF8F5]"
              >
                Show All Essentials
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => {
                const qty = getQty(product.id);
                const discountPct = Math.round(
                  ((product.mrp - product.price) / product.mrp) * 100
                );
                return (
                  <article
                    key={product.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E6E1D8] bg-white transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => setActiveProduct(product)}
                        className="block w-full aspect-[4/3] overflow-hidden border-b border-[#EFEBE3] text-left"
                      >
                        <ProductArtwork
                          kind={product.artwork}
                          title={product.name}
                          imageUrl={product.imageUrl}
                          imageFocus={product.imageFocus}
                        />
                      </button>
                      <div className="p-5 pb-4">
                        <div className="flex items-center justify-between text-xs text-[#5A564E]">
                          <span className="truncate">
                            {product.categoryLabel} · {product.unitLabel}
                          </span>
                          <span className="inline-flex items-center gap-1 shrink-0 font-mono font-medium text-[#141414] tabular-nums">
                            <Star className="h-3 w-3 fill-[#B08D57] text-[#B08D57]" />
                            {product.rating.toFixed(1)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveProduct(product)}
                          className="mt-2 block w-full text-left text-base font-semibold text-[#141414] line-clamp-1 transition-colors hover:text-[#9E1B32]"
                        >
                          {product.name}
                        </button>
                        <p className="mt-1 text-xs leading-relaxed text-[#5A564E] line-clamp-2">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#EFEBE3] px-5 py-4">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-base font-semibold text-[#141414] tabular-nums">
                            ₹{product.price}
                          </span>
                          <span className="font-mono text-xs text-[#9C9588] line-through tabular-nums">
                            ₹{product.mrp}
                          </span>
                        </div>
                        <span className="block text-[11px] font-medium text-[#15803D]">
                          {discountPct}% off · {product.ordersCount}
                        </span>
                      </div>

                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          className="rounded-lg border border-[#141414] bg-white px-4 py-2 text-xs font-semibold text-[#141414] whitespace-nowrap shrink-0 transition-colors hover:border-[#9E1B32] hover:bg-[#9E1B32] hover:text-white"
                        >
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center rounded-lg bg-[#9E1B32] text-white">
                          <button
                            type="button"
                            onClick={() => updateQty(product.id, -1)}
                            aria-label={`Decrease quantity of ${product.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-l-lg hover:bg-[#7F1528]"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center font-mono text-xs font-semibold tabular-nums">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(product.id, 1)}
                            aria-label={`Increase quantity of ${product.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-r-lg hover:bg-[#7F1528]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* 3-Step Delivery Promise */}
        <section
          id="delivery"
          className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-[#141414]">
                The CampusCart Standard
              </h2>
              <p className="mt-1 text-sm text-[#5A564E]">
                Designed around DGU MBA timetables and evening hostel hours.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openBagDrawer('orders')}
              className="self-start text-sm font-medium text-[#9E1B32] hover:underline underline-offset-4 md:self-auto"
            >
              View Order History ({orders.length})
            </button>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-[#E6E1D8] bg-white p-6">
              <p className="font-mono text-xs font-medium text-[#B08D57]">01. Order by 6:30 PM</p>
              <h3 className="mt-2 text-base font-semibold text-[#141414]">
                Curated baskets or individual items
              </h3>
              <p className="mt-1.5 text-sm text-[#5A564E]">
                Sign in with Google to save your hostel block and room, and check out in seconds right inside the app.
              </p>
            </div>
            <div className="rounded-xl border border-[#E6E1D8] bg-white p-6">
              <p className="font-mono text-xs font-medium text-[#B08D57]">02. UPI or Cash</p>
              <h3 className="mt-2 text-base font-semibold text-[#141414]">
                Honest student pricing
              </h3>
              <p className="mt-1.5 text-sm text-[#5A564E]">
                Complimentary delivery on ₹149+ orders, plus ₹50 off your first basket with DGU50.
              </p>
            </div>
            <div className="rounded-xl border border-[#E6E1D8] bg-white p-6">
              <p className="font-mono text-xs font-medium text-[#B08D57]">03. 7:00–9:00 PM Drop</p>
              <h3 className="mt-2 text-base font-semibold text-[#141414]">
                Delivered to your hostel block
              </h3>
              <p className="mt-1.5 text-sm text-[#5A564E]">
                Reliable evening batch delivery across DGU MBA Hostels and the 2 km Dehradun PG cluster.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Compact Floating Bag Bar */}
      {totalItems > 0 && !drawerOpen && (
        <div className="fixed right-4 bottom-4 left-4 z-30 mx-auto max-w-[480px] sm:left-auto sm:w-auto">
          <button
            type="button"
            onClick={() => openBagDrawer('cart')}
            className="flex w-full items-center justify-between gap-6 rounded-xl bg-[#141414] px-5 py-3 text-white shadow-xl transition-colors hover:bg-[#9E1B32]"
          >
            <div className="text-left">
              <span className="block font-mono text-xs font-semibold tabular-nums">
                {totalItems} {totalItems === 1 ? 'ITEM' : 'ITEMS'} · ₹{cartSubtotal}
              </span>
              <span className="block text-[11px] text-[#C6C0B5]">
                {cartSubtotal >= 149
                  ? 'Complimentary hostel delivery unlocked'
                  : `Add ₹${149 - cartSubtotal} for complimentary delivery`}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap shrink-0">
              Checkout
              <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      )}

      <footer className="border-t border-[#E6E1D8] bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-4 px-4 py-8 text-xs text-[#5A564E] sm:flex-row sm:items-center sm:px-6">
          <div>
            <span className="font-display text-base font-bold text-[#141414]">CampusCart</span>
            <span className="ml-2">Your Campus, Your Cart. · DGU Campus &amp; Dehradun</span>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <a href="#catalog" className="hover:text-[#141414]">
              Catalog
            </a>
            <a href="#delivery" className="hover:text-[#141414]">
              Delivery
            </a>
            <button
              type="button"
              onClick={() => openBagDrawer('orders')}
              className="hover:text-[#141414]"
            >
              My Orders
            </button>
          </div>
        </div>
      </footer>

      <ProductModal
        product={activeProduct}
        quantity={activeProduct ? getQty(activeProduct.id) : 0}
        onClose={() => setActiveProduct(null)}
        onAdd={addToCart}
        onUpdateQty={updateQty}
      />

      <CartDrawer
        key={`${drawerOpen}-${drawerTab}-${selectedHostel}-${selectedSlot}-${user?.uid ?? 'guest'}`}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={cart}
        onUpdateQty={updateQty}
        onRemoveItem={removeItem}
        onClearCart={() => setCart([])}
        orders={orders}
        onPlaceOrder={handlePlaceOrder}
        onCancelOrder={user ? handleCancelOrder : undefined}
        initialTab={drawerTab}
        selectedHostel={selectedHostel}
        selectedSlot={selectedSlot}
        user={user}
        profile={profile}
        authLoading={authLoading}
        authError={authError}
        onGoogleSignIn={handleGoogleSignIn}
      />
    </div>
  );
}
