import React, { useState, useEffect, useRef } from 'react';
import { MainCategory, SubCategory, Product } from './types/store';
import { PRODUCTS, CATEGORIES_META, PORTFOLIO_URL, BRAND_EMAIL } from './data/products';

interface CartItem {
  product: Product;
  quantity: number;
}

const FAQ_ITEMS = [
  {
    question: 'What kind of assets will I find here?',
    answer:
      'The store is organized into After Effects (presets, plugins, scripts), Premiere Pro (plugins, MOGRT files, presets), and Pro Essentials (BGMs, SFX, overlays, Apple animated emojis, and raw practice footage). Each product page lists exact contents and supported software versions.',
  },
  {
    question: 'Which editing software are the assets compatible with?',
    answer:
      'Compatibility depends on the specific product. After Effects presets are built for After Effects (2022+), MOGRT templates and transition presets are designed for Premiere Pro (2021+), while Pro Essentials audio and overlays work universally across any video editing software.',
  },
  {
    question: 'How will I receive my files after payment?',
    answer:
      'The live store will automatically deliver a secure download link after verified payment. This will be connected to our file-delivery backend before launching full commercial sales.',
  },
  {
    question: 'Can I get help if I have trouble using an asset?',
    answer:
      `You can reach out for support directly via email at ${BRAND_EMAIL} or via Instagram DM. Please include your order details and the editing software version you are using.`,
  },
];

export default function App() {
  const [selectedMainCategory, setSelectedMainCategory] = useState<'all' | MainCategory>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<'all' | SubCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Dropdown states for header items
  const [isAeDropdownOpen, setIsAeDropdownOpen] = useState(false);
  const [isPrDropdownOpen, setIsPrDropdownOpen] = useState(false);
  const [isPeDropdownOpen, setIsPeDropdownOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const aeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const peTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aeDropdownRef = useRef<HTMLDivElement>(null);
  const prDropdownRef = useRef<HTMLDivElement>(null);
  const peDropdownRef = useRef<HTMLDivElement>(null);

  // Mobile menu subcategory collapse state
  const [mobileExpandedCat, setMobileExpandedCat] = useState<MainCategory | null>(null);

  // Modals
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  
  // FAQ accordion
  const [openFaqIndexes, setOpenFaqIndexes] = useState<number[]>([0]);

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const money = (amount: number) => '₹' + amount.toLocaleString('en-IN');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 2200);
    return () => clearTimeout(timer);
  }, [showToast]);

  // Close dropdowns and modals on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (aeDropdownRef.current && !aeDropdownRef.current.contains(e.target as Node)) {
        setIsAeDropdownOpen(false);
      }
      if (prDropdownRef.current && !prDropdownRef.current.contains(e.target as Node)) {
        setIsPrDropdownOpen(false);
      }
      if (peDropdownRef.current && !peDropdownRef.current.contains(e.target as Node)) {
        setIsPeDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAeDropdownOpen(false);
        setIsPrDropdownOpen(false);
        setIsPeDropdownOpen(false);
        setIsContactModalOpen(false);
        setIsCartOpen(false);
        setSelectedProductDetail(null);
        setIsCheckoutModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Lock body scroll when drawers or modals are open
  useEffect(() => {
    if (isCartOpen || selectedProductDetail || isCheckoutModalOpen || isContactModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isCartOpen, selectedProductDetail, isCheckoutModalOpen, isContactModalOpen]);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('Thank you! Piyush will get back to you shortly.');
    setContactName('');
    setContactEmail('');
    setContactMessage('');
    setIsContactModalOpen(false);
  };

  // Filtering products
  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesMain = selectedMainCategory === 'all' || product.mainCategory === selectedMainCategory;
    const matchesSub = selectedSubcategory === 'all' || product.subcategory === selectedSubcategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesMain && matchesSub && matchesSearch;
  });

  const selectCategoryFromNav = (mainCat: 'all' | MainCategory, subCat: 'all' | SubCategory = 'all') => {
    setSelectedMainCategory(mainCat);
    setSelectedSubcategory(subCat);
    setSearchQuery('');
    setIsAeDropdownOpen(false);
    setIsPrDropdownOpen(false);
    setIsPeDropdownOpen(false);
    setIsMenuOpen(false);
    const shopEl = document.getElementById('shop');
    if (shopEl) {
      shopEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const resetFilters = () => {
    setSelectedMainCategory('all');
    setSelectedSubcategory('all');
    setSearchQuery('');
  };

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    triggerToast(`${product.name} added to cart`);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== id));
  };

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const activeCategoryMeta = CATEGORIES_META.find((c) => c.id === selectedMainCategory);
  const activeSubcategoryMeta = activeCategoryMeta?.subcategories.find((s) => s.id === selectedSubcategory);

  // Render product card artwork using the brand's CSS illustrations
  const renderProductArt = (product: Product) => {
    switch (product.artVariant) {
      case 'text':
        return (
          <div className="product-art art-text">
            <span className="art-chip">{product.categoryLabel}</span>
            <span className="art-index">{product.artIndex}</span>
            <div className="art-kinetic">
              <small>AFTER EFFECTS PRESETS</small>
              <strong>
                MOTION<br />
                <em>PRESETS.</em>
              </strong>
              <span>TEXT ANIMATION</span>
            </div>
          </div>
        );
      case 'bundle':
        return (
          <div className="product-art art-bundle">
            <span className="art-chip">{product.categoryLabel}</span>
            <span className="art-index">{product.artIndex}</span>
            <div className="art-bundle-shapes" aria-hidden="true">
              <i></i><i></i><i></i><i></i><i></i>
            </div>
          </div>
        );
      case 'overlays':
        return (
          <div className="product-art art-overlays">
            <span className="art-chip">{product.categoryLabel}</span>
            <span className="art-index">{product.artIndex}</span>
            <div className="art-overlay-stack">
              <i></i><i></i><i></i>
              <b>ZOOM</b>
            </div>
          </div>
        );
      case 'sfx':
      default:
        return (
          <div className="product-art art-sfx">
            <span className="art-chip" style={{ color: 'var(--ink)' }}>{product.categoryLabel}</span>
            <span className="art-index" style={{ color: 'var(--ink)' }}>{product.artIndex}</span>
            <div className="art-waveform" aria-hidden="true">
              <i style={{ '--h': '25px' } as React.CSSProperties}></i>
              <i style={{ '--h': '60px' } as React.CSSProperties}></i>
              <i style={{ '--h': '85px' } as React.CSSProperties}></i>
              <i style={{ '--h': '40px' } as React.CSSProperties}></i>
              <i style={{ '--h': '95px' } as React.CSSProperties}></i>
              <i style={{ '--h': '70px' } as React.CSSProperties}></i>
              <i style={{ '--h': '45px' } as React.CSSProperties}></i>
              <i style={{ '--h': '80px' } as React.CSSProperties}></i>
            </div>
            <span className="art-sfx-label">SMOOTH RADIAL BLUR</span>
          </div>
        );
    }
  };

  return (
    <>
      {/* Top announcement bar */}
      <div className="topline">Made for editors who care about the details.</div>

      {/* Navigation */}
      <header className="site-header">
        <div className="wrap nav">
          {/* Logo modification: ONLY text 'piyushretention', lowercase, bold DM Sans, no dots or symbols */}
          <a className="brand" href="#home" aria-label="PiyushRetention home">
            piyushretention
          </a>

          {/* Desktop Navigation Links */}
          {/* Desktop Navigation Links: Portfolio, After effect, Premier pro, Contact us */}
          <nav className="nav-links hidden md:flex" aria-label="Main navigation">
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Portfolio
            </a>

            {/* After effect Dropdown */}
            <div
              className="nav-dropdown-wrapper"
              ref={aeDropdownRef}
              onMouseEnter={() => {
                if (aeTimeoutRef.current) clearTimeout(aeTimeoutRef.current);
                setIsAeDropdownOpen(true);
              }}
              onMouseLeave={() => {
                aeTimeoutRef.current = setTimeout(() => setIsAeDropdownOpen(false), 180);
              }}
            >
              <button
                className={`nav-dropdown-trigger ${isAeDropdownOpen ? 'open' : ''} ${selectedMainCategory === 'after-effects' ? 'active' : ''}`}
                onClick={() => {
                  selectCategoryFromNav('after-effects', 'all');
                  setIsAeDropdownOpen((prev) => !prev);
                }}
                aria-expanded={isAeDropdownOpen}
                aria-haspopup="true"
              >
                <span>After effect</span>
                <span className="nav-dropdown-arrow">▼</span>
              </button>

              {isAeDropdownOpen && (
                <div className="single-dropdown-menu" role="menu">
                  <button
                    onClick={() => {
                      selectCategoryFromNav('after-effects', 'all');
                      setIsAeDropdownOpen(false);
                    }}
                  >
                    <span>All After Effects</span>
                    <span className="sub-count">1 Pack</span>
                  </button>
                  <button
                    onClick={() => {
                      selectCategoryFromNav('after-effects', 'ae-presets');
                      setIsAeDropdownOpen(false);
                    }}
                  >
                    <span>Presets</span>
                    <span className="sub-count">1 Pack</span>
                  </button>
                  <button
                    onClick={() => {
                      selectCategoryFromNav('after-effects', 'ae-plugins');
                      setIsAeDropdownOpen(false);
                    }}
                  >
                    <span>Plugins</span>
                    <span className="sub-count">Soon</span>
                  </button>
                  <button
                    onClick={() => {
                      selectCategoryFromNav('after-effects', 'ae-scripts');
                      setIsAeDropdownOpen(false);
                    }}
                  >
                    <span>Scripts</span>
                    <span className="sub-count">Soon</span>
                  </button>
                </div>
              )}
            </div>

            {/* Premier pro Dropdown */}
            <div
              className="nav-dropdown-wrapper"
              ref={prDropdownRef}
              onMouseEnter={() => {
                if (prTimeoutRef.current) clearTimeout(prTimeoutRef.current);
                setIsPrDropdownOpen(true);
              }}
              onMouseLeave={() => {
                prTimeoutRef.current = setTimeout(() => setIsPrDropdownOpen(false), 180);
              }}
            >
              <button
                className={`nav-dropdown-trigger ${isPrDropdownOpen ? 'open' : ''} ${selectedMainCategory === 'premiere-pro' ? 'active' : ''}`}
                onClick={() => {
                  selectCategoryFromNav('premiere-pro', 'all');
                  setIsPrDropdownOpen((prev) => !prev);
                }}
                aria-expanded={isPrDropdownOpen}
                aria-haspopup="true"
              >
                <span>Premier pro</span>
                <span className="nav-dropdown-arrow">▼</span>
              </button>

              {isPrDropdownOpen && (
                <div className="single-dropdown-menu" role="menu">
                  <button
                    onClick={() => {
                      selectCategoryFromNav('premiere-pro', 'all');
                      setIsPrDropdownOpen(false);
                    }}
                  >
                    <span>All Premiere Pro</span>
                    <span className="sub-count">3 Packs</span>
                  </button>
                  <button
                    onClick={() => {
                      selectCategoryFromNav('premiere-pro', 'pr-plugins');
                      setIsPrDropdownOpen(false);
                    }}
                  >
                    <span>Plugins</span>
                    <span className="sub-count">Soon</span>
                  </button>
                  <button
                    onClick={() => {
                      selectCategoryFromNav('premiere-pro', 'mogrt-files');
                      setIsPrDropdownOpen(false);
                    }}
                  >
                    <span>MOGRT Files</span>
                    <span className="sub-count">1 Pack</span>
                  </button>
                  <button
                    onClick={() => {
                      selectCategoryFromNav('premiere-pro', 'pr-presets');
                      setIsPrDropdownOpen(false);
                    }}
                  >
                    <span>Presets</span>
                    <span className="sub-count">2 Packs</span>
                  </button>
                </div>
              )}
            </div>

            {/* Pro Essentials Dropdown */}
            <div
              className="nav-dropdown-wrapper"
              ref={peDropdownRef}
              onMouseEnter={() => {
                if (peTimeoutRef.current) clearTimeout(peTimeoutRef.current);
                setIsPeDropdownOpen(true);
              }}
              onMouseLeave={() => {
                peTimeoutRef.current = setTimeout(() => setIsPeDropdownOpen(false), 180);
              }}
            >
              <button
                className={`nav-dropdown-trigger ${isPeDropdownOpen ? 'open' : ''} ${selectedMainCategory === 'pro-essentials' ? 'active' : ''}`}
                onClick={() => {
                  selectCategoryFromNav('pro-essentials', 'all');
                  setIsPeDropdownOpen((prev) => !prev);
                }}
                aria-expanded={isPeDropdownOpen}
                aria-haspopup="true"
              >
                <span>Pro Essentials</span>
                <span className="nav-dropdown-arrow">▼</span>
              </button>

              {isPeDropdownOpen && (
                <div className="single-dropdown-menu" role="menu">
                  <button
                    onClick={() => {
                      selectCategoryFromNav('pro-essentials', 'all');
                      setIsPeDropdownOpen(false);
                    }}
                  >
                    <span>All Pro Essentials</span>
                    <span className="sub-count">All</span>
                  </button>
                  <button
                    onClick={() => {
                      selectCategoryFromNav('pro-essentials', 'bgms');
                      setIsPeDropdownOpen(false);
                    }}
                  >
                    <span>BGMs</span>
                    <span className="sub-count">Soon</span>
                  </button>
                  <button
                    onClick={() => {
                      selectCategoryFromNav('pro-essentials', 'sfx');
                      setIsPeDropdownOpen(false);
                    }}
                  >
                    <span>Sound Effects (SFX)</span>
                    <span className="sub-count">Soon</span>
                  </button>
                  <button
                    onClick={() => {
                      selectCategoryFromNav('pro-essentials', 'overlays');
                      setIsPeDropdownOpen(false);
                    }}
                  >
                    <span>Overlays</span>
                    <span className="sub-count">Soon</span>
                  </button>
                  <button
                    onClick={() => {
                      selectCategoryFromNav('pro-essentials', 'animated-emojis');
                      setIsPeDropdownOpen(false);
                    }}
                  >
                    <span>Apple Animated Emojis</span>
                    <span className="sub-count">Soon</span>
                  </button>
                  <button
                    onClick={() => {
                      selectCategoryFromNav('pro-essentials', 'raw-videos');
                      setIsPeDropdownOpen(false);
                    }}
                  >
                    <span>Raw Videos for Practice</span>
                    <span className="sub-count">Soon</span>
                  </button>
                </div>
              )}
            </div>

            {/* Contact us Button */}
            <button
              className="nav-link-btn"
              onClick={() => setIsContactModalOpen(true)}
            >
              Contact us
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="nav-actions">
            <button
              className="cart-button"
              id="openCart"
              aria-label="Open shopping cart"
              onClick={() => setIsCartOpen(true)}
            >
              <span className="cart-word">Your cart</span>
              <span className="cart-count" id="cartCount">
                {totalCount}
              </span>
            </button>

            <button
              className="menu-toggle"
              id="menuToggle"
              aria-label="Open mobile menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? '×' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <nav className="nav-links open md:hidden" id="navLinks" aria-label="Mobile navigation">
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
            >
              Portfolio ↗
            </a>

            {/* After effect Accordion */}
            <div style={{ width: '100%' }}>
              <button
                className="mobile-assets-toggle"
                onClick={() =>
                  setMobileExpandedCat(mobileExpandedCat === 'after-effects' ? null : 'after-effects')
                }
              >
                <span>After effect</span>
                <span>{mobileExpandedCat === 'after-effects' ? '▲' : '▼'}</span>
              </button>
              {mobileExpandedCat === 'after-effects' && (
                <div className="mobile-categories-tree">
                  <button
                    className="mobile-sub-btn"
                    onClick={() => selectCategoryFromNav('after-effects', 'all')}
                  >
                    All After Effects
                  </button>
                  <button
                    className="mobile-sub-btn"
                    onClick={() => selectCategoryFromNav('after-effects', 'ae-presets')}
                  >
                    Presets (1 Pack)
                  </button>
                  <button
                    className="mobile-sub-btn"
                    onClick={() => selectCategoryFromNav('after-effects', 'ae-plugins')}
                  >
                    Plugins (Coming Soon)
                  </button>
                  <button
                    className="mobile-sub-btn"
                    onClick={() => selectCategoryFromNav('after-effects', 'ae-scripts')}
                  >
                    Scripts (Coming Soon)
                  </button>
                </div>
              )}
            </div>

            {/* Premier pro Accordion */}
            <div style={{ width: '100%' }}>
              <button
                className="mobile-assets-toggle"
                onClick={() =>
                  setMobileExpandedCat(mobileExpandedCat === 'premiere-pro' ? null : 'premiere-pro')
                }
              >
                <span>Premier pro</span>
                <span>{mobileExpandedCat === 'premiere-pro' ? '▲' : '▼'}</span>
              </button>
              {mobileExpandedCat === 'premiere-pro' && (
                <div className="mobile-categories-tree">
                  <button
                    className="mobile-sub-btn"
                    onClick={() => selectCategoryFromNav('premiere-pro', 'all')}
                  >
                    All Premiere Pro
                  </button>
                  <button
                    className="mobile-sub-btn"
                    onClick={() => selectCategoryFromNav('premiere-pro', 'pr-plugins')}
                  >
                    Plugins (Coming Soon)
                  </button>
                  <button
                    className="mobile-sub-btn"
                    onClick={() => selectCategoryFromNav('premiere-pro', 'mogrt-files')}
                  >
                    MOGRT Files (1 Pack)
                  </button>
                  <button
                    className="mobile-sub-btn"
                    onClick={() => selectCategoryFromNav('premiere-pro', 'pr-presets')}
                  >
                    Presets (2 Packs)
                  </button>
                </div>
              )}
            </div>

            {/* Pro Essentials Accordion */}
            <div style={{ width: '100%' }}>
              <button
                className="mobile-assets-toggle"
                onClick={() =>
                  setMobileExpandedCat(mobileExpandedCat === 'pro-essentials' ? null : 'pro-essentials')
                }
              >
                <span>Pro Essentials</span>
                <span>{mobileExpandedCat === 'pro-essentials' ? '▲' : '▼'}</span>
              </button>
              {mobileExpandedCat === 'pro-essentials' && (
                <div className="mobile-categories-tree">
                  <button
                    className="mobile-sub-btn"
                    onClick={() => selectCategoryFromNav('pro-essentials', 'all')}
                  >
                    All Pro Essentials
                  </button>
                  <button
                    className="mobile-sub-btn"
                    onClick={() => selectCategoryFromNav('pro-essentials', 'bgms')}
                  >
                    BGMs
                  </button>
                  <button
                    className="mobile-sub-btn"
                    onClick={() => selectCategoryFromNav('pro-essentials', 'sfx')}
                  >
                    Sound Effects (SFX)
                  </button>
                  <button
                    className="mobile-sub-btn"
                    onClick={() => selectCategoryFromNav('pro-essentials', 'overlays')}
                  >
                    Overlays
                  </button>
                  <button
                    className="mobile-sub-btn"
                    onClick={() => selectCategoryFromNav('pro-essentials', 'animated-emojis')}
                  >
                    Apple Animated Emojis
                  </button>
                  <button
                    className="mobile-sub-btn"
                    onClick={() => selectCategoryFromNav('pro-essentials', 'raw-videos')}
                  >
                    Raw Videos for Practice
                  </button>
                </div>
              )}
            </div>

            {/* Contact us */}
            <button
              className="nav-link-btn"
              style={{ textAlign: 'left', padding: '6px 0', fontSize: '14px' }}
              onClick={() => {
                setIsContactModalOpen(true);
                setIsMenuOpen(false);
              }}
            >
              Contact us
            </button>
          </nav>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero" id="home">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">The editor's asset library</span>
              <h1>
                Make every
                <br />
                frame work <span>harder.</span>
              </h1>
              <p>
                Text animations, overlays and sound effects to help you build sharper edits, keep the pace moving and make your content feel intentional.
              </p>
              <div className="hero-ctas">
                <a className="btn btn-primary" href="#shop">
                  Explore the assets <span aria-hidden="true">↗</span>
                </a>
                <a className="btn btn-ghost" href="#why">
                  What's inside
                </a>
              </div>
              <div className="hero-note">DESIGNED FOR THE TIMELINE. BUILT FOR THE SCROLL.</div>
            </div>

            <div className="showcase" aria-label="Preview of editing assets">
              <div className="showcase-glow"></div>
              <div className="editor-window">
                <div className="window-top">
                  <div className="window-dots">
                    <i></i>
                    <i></i>
                    <i></i>
                  </div>
                  <span className="window-label">PR / MOTION KIT 001</span>
                  <span className="window-label">00:08:24</span>
                </div>
                <div className="preview-stage">
                  <div className="preview-meta">
                    <span>TEXT ANIMATION PREVIEW</span>
                    <span>01 / 04</span>
                  </div>
                  <div className="preview-title">
                    STOP
                    <br />
                    <span>THE SCROLL.</span>
                  </div>
                  <div className="preview-bottom">
                    <span>HOOK / IMPACT / RETENTION</span>
                    <div className="sound-wave" aria-hidden="true">
                      <i style={{ '--h': '8px' } as React.CSSProperties}></i>
                      <i style={{ '--h': '17px' } as React.CSSProperties}></i>
                      <i style={{ '--h': '12px' } as React.CSSProperties}></i>
                      <i style={{ '--h': '25px' } as React.CSSProperties}></i>
                      <i style={{ '--h': '15px' } as React.CSSProperties}></i>
                      <i style={{ '--h': '22px' } as React.CSSProperties}></i>
                      <i style={{ '--h': '10px' } as React.CSSProperties}></i>
                      <i style={{ '--h': '27px' } as React.CSSProperties}></i>
                      <i style={{ '--h': '14px' } as React.CSSProperties}></i>
                      <i style={{ '--h': '20px' } as React.CSSProperties}></i>
                      <i style={{ '--h': '9px' } as React.CSSProperties}></i>
                      <i style={{ '--h': '17px' } as React.CSSProperties}></i>
                    </div>
                  </div>
                </div>
                <div className="timeline">
                  <div className="timeline-row">
                    <span className="track-name">TEXT</span>
                    <div className="track track-row-1">
                      <b></b>
                    </div>
                  </div>
                  <div className="timeline-row">
                    <span className="track-name">FX</span>
                    <div className="track track-row-2">
                      <b></b>
                    </div>
                  </div>
                  <div className="timeline-row">
                    <span className="track-name">SFX</span>
                    <div className="track track-row-3">
                      <b></b>
                    </div>
                  </div>
                </div>
              </div>
              <div className="floating-tag tag-one">MOTION / 001</div>
              <div className="floating-tag tag-two">MAKE IT MOVE ↗</div>
              <div className="palette-ribbon" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </section>

        {/* Category ticker */}
        <div className="ticker" aria-label="Asset categories">
          <div className="wrap ticker-inner">
            <span className="ticker-item">
              <b></b> After Effects Presets
            </span>
            <span className="ticker-item">
              <b></b> Premiere MOGRTs
            </span>
            <span className="ticker-item">
              <b></b> Pro Essentials
            </span>
            <span className="ticker-item">
              <b></b> Zoom & Blur Presets
            </span>
            <span className="ticker-item">
              <b></b> Built for your workflow
            </span>
          </div>
        </div>

        {/* Asset Shopping Section */}
        <section className="section" id="shop">
          <div className="wrap">
            <div className="section-head">
              <div>
                <span className="eyebrow">The asset shop</span>
                <h2>
                  Tools for your
                  <br />
                  next great edit.
                </h2>
              </div>
              <p>Pick the pieces you need. Mix motion, sound and texture to give your next project its own rhythm.</p>
            </div>

            {/* Shop Toolbar: Category Filter Buttons + Search Field */}
            <div className="shop-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                {/* Main Category Tabs */}
                <div className="filters" role="group" aria-label="Filter by main category" style={{ margin: 0 }}>
                  <button
                    className={`filter-btn ${selectedMainCategory === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedMainCategory('all');
                      setSelectedSubcategory('all');
                    }}
                  >
                    All Assets
                  </button>
                  <button
                    className={`filter-btn ${selectedMainCategory === 'after-effects' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedMainCategory('after-effects');
                      setSelectedSubcategory('all');
                    }}
                  >
                    After Effects
                  </button>
                  <button
                    className={`filter-btn ${selectedMainCategory === 'premiere-pro' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedMainCategory('premiere-pro');
                      setSelectedSubcategory('all');
                    }}
                  >
                    Premiere Pro
                  </button>
                  <button
                    className={`filter-btn ${selectedMainCategory === 'pro-essentials' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedMainCategory('pro-essentials');
                      setSelectedSubcategory('all');
                    }}
                  >
                    Pro Essentials
                  </button>
                </div>

                {/* Product Search Box */}
                <div className="shop-search-box">
                  <span className="shop-search-icon">🔍</span>
                  <input
                    type="text"
                    className="shop-search-input"
                    placeholder="Search assets by name or tool..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="shop-clear-search"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Subcategory Row (shown when a main category is selected) */}
              {selectedMainCategory !== 'all' && activeCategoryMeta && (
                <div className="subfilters-row">
                  <span style={{ font: "500 10px 'DM Mono', monospace", color: 'var(--muted)', textTransform: 'uppercase', marginRight: '4px' }}>
                    Subcategories:
                  </span>
                  <button
                    className={`subfilter-btn ${selectedSubcategory === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedSubcategory('all')}
                  >
                    All {activeCategoryMeta.name}
                  </button>
                  {activeCategoryMeta.subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      className={`subfilter-btn ${selectedSubcategory === sub.id ? 'active' : ''}`}
                      onClick={() => setSelectedSubcategory(sub.id)}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Active Filter Indicator Banner */}
            {(selectedMainCategory !== 'all' || selectedSubcategory !== 'all' || searchQuery) && (
              <div className="category-active-banner">
                <p>
                  Showing:{' '}
                  <strong>
                    {selectedMainCategory === 'all'
                      ? 'All Assets'
                      : activeCategoryMeta?.name}
                  </strong>
                  {selectedSubcategory !== 'all' && (
                    <>
                      {' › '}
                      <strong>{activeSubcategoryMeta?.name}</strong>
                    </>
                  )}
                  {searchQuery && (
                    <>
                      {' — matching '}
                      <em>"{searchQuery}"</em>
                    </>
                  )}
                  {' '}({filteredProducts.length} {filteredProducts.length === 1 ? 'pack' : 'packs'})
                </p>
                <button
                  className="reset-filter-link"
                  onClick={resetFilters}
                >
                  Reset to All Assets ×
                </button>
              </div>
            )}

            {/* Product Cards Grid or Clean Empty State */}
            <div className="product-grid" id="productGrid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <article
                    key={product.id}
                    className="product-card"
                    data-category={product.mainCategory}
                    data-subcategory={product.subcategory}
                    data-id={product.id}
                    data-name={product.name}
                    data-price={product.price}
                  >
                    {renderProductArt(product)}
                    <div className="product-info">
                      <div className="product-kicker">
                        <span>{product.kicker}</span>
                        <span>{product.artIndex}</span>
                      </div>
                      <h3>{product.name}</h3>
                      <p>{product.shortDescription}</p>
                      <div className="product-buy">
                        <span className="price">{money(product.price)}</span>
                        <div className="card-actions">
                          <button
                            className="view-details-btn"
                            onClick={() => setSelectedProductDetail(product)}
                          >
                            View Details
                          </button>
                          <button
                            className="add-button"
                            aria-label={`Add ${product.name} to cart`}
                            onClick={() => addToCart(product)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                /* Clean Empty Category State - "More assets coming soon." */
                <div className="coming-soon-box">
                  <span className="eyebrow">Category Update</span>
                  <h3>More assets coming soon.</h3>
                  <p>
                    {searchQuery
                      ? `No products found matching "${searchQuery}". Try a different keyword or reset your filter.`
                      : `New assets for ${activeSubcategoryMeta?.name || activeCategoryMeta?.name || 'this workflow'} are currently in preparation and will be uploaded here.`}
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={resetFilters}
                  >
                    Browse Available Assets
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Value Section (Why Choose These Assets) */}
        <section className="value-section" id="why">
          <div className="wrap value-layout">
            <div className="value-copy">
              <span className="eyebrow">Made for the timeline</span>
              <h2>Less time building. More time creating.</h2>
              <p>
                Your tools should support your creative process, not slow it down. PiyushRetention is a focused library of editing assets made to slot into the way modern editors work.
              </p>
            </div>
            <div className="value-list">
              <div className="value-item">
                <span className="num">01 / SPEED</span>
                <h3>Keep your flow</h3>
                <p>Reach for ready-made creative elements instead of rebuilding every detail.</p>
              </div>
              <div className="value-item">
                <span className="num">02 / STYLE</span>
                <h3>Make it yours</h3>
                <p>Combine assets, adjust them and make each edit feel like your own.</p>
              </div>
              <div className="value-item">
                <span className="num">03 / FOCUS</span>
                <h3>Built for short-form</h3>
                <p>Designed around the pace and visual language of modern social content.</p>
              </div>
              <div className="value-item">
                <span className="num">04 / GROW</span>
                <h3>Keep creating</h3>
                <p>Spend less energy on repetitive setup and more on the story you're telling.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Red CTA Section */}
        <section className="cta-section">
          <div className="wrap">
            <div className="cta-card">
              <div>
                <span className="eyebrow">Your next edit starts here</span>
                <h2>Give your timeline a new kind of energy.</h2>
              </div>
              <a href="#shop" className="btn">
                Find your assets <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section" id="faq">
          <div className="wrap faq-layout">
            <div className="faq-intro">
              <span className="eyebrow">A few details</span>
              <h2>
                Good to
                <br />
                know.
              </h2>
              <p>Have a question before you pick your next editing asset? Start here.</p>
            </div>
            <div className="faq-list">
              {FAQ_ITEMS.map((faq, index) => {
                const isOpen = openFaqIndexes.includes(index);
                return (
                  <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
                    <button
                      className="faq-question"
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.question}</span>
                      <span>+</span>
                    </button>
                    <div className="faq-answer">{faq.answer}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer>
        <div className="wrap">
          <div className="footer-main">
            <div>
              {/* Logo modification: ONLY text 'piyushretention', lowercase, bold DM Sans, no dots or marks */}
              <a className="brand" href="#home">
                piyushretention
              </a>
              <div className="footer-copy">Tools for editors. Space for ideas.</div>
            </div>
            <div className="footer-links">
              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Portfolio ↗
              </a>
              <a href="#shop" onClick={() => selectCategoryFromNav('after-effects', 'all')}>
                After Effects
              </a>
              <a href="#shop" onClick={() => selectCategoryFromNav('premiere-pro', 'all')}>
                Premiere Pro
              </a>
              <a href="#shop" onClick={() => selectCategoryFromNav('pro-essentials', 'all')}>
                Pro Essentials
              </a>
              <a href="#faq">FAQs</a>
              <a
                href="https://www.instagram.com/piyushretention/"
                target="_blank"
                rel="noreferrer"
              >
                Instagram ↗
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} PIYUSHRETENTION</span>
            <span>MADE FOR THE EDIT.</span>
          </div>
        </div>
      </footer>

      {/* Backdrop */}
      <div
        className={`backdrop ${isCartOpen ? 'show' : ''}`}
        id="backdrop"
        onClick={() => setIsCartOpen(false)}
      ></div>

      {/* Shopping Cart Drawer */}
      <aside
        className={`cart-drawer ${isCartOpen ? 'open' : ''}`}
        id="cartDrawer"
        aria-label="Shopping cart"
        aria-hidden={!isCartOpen}
      >
        <div className="cart-head">
          <h3>
            Your cart <span style={{ color: 'var(--red)' }} id="cartHeadCount">({totalCount})</span>
          </h3>
          <button
            className="icon-button"
            id="closeCart"
            aria-label="Close cart"
            onClick={() => setIsCartOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="cart-items" id="cartItems">
          {cart.length === 0 ? (
            <div className="cart-empty">
              Your cart is empty.
              <br />
              Your next edit is waiting.
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="cart-line">
                <div>
                  <strong>{item.product.name}</strong>
                  <small>
                    QTY {item.quantity} · {money(item.product.price)} EACH
                  </small>
                </div>
                <div className="cart-line-right">
                  <b>{money(item.product.price * item.quantity)}</b>
                  <button
                    className="remove-line"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-foot">
          <div className="cart-total">
            <span>Subtotal</span>
            <strong id="cartTotal">{money(totalPrice)}</strong>
          </div>
          <button
            className="btn btn-primary checkout-button"
            id="checkoutButton"
            onClick={() => {
              if (!cart.length) {
                triggerToast('Add an asset to your cart first');
                return;
              }
              setIsCheckoutModalOpen(true);
            }}
          >
            Continue to checkout <span>↗</span>
          </button>
          <p className="cart-disclaimer">
            Demo storefront only. Payment and digital delivery are not connected yet.
          </p>
        </div>
      </aside>

      {/* Dedicated Product Detail Modal */}
      {selectedProductDetail && (
        <div
          className="product-detail-modal show"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProductDetail(null);
          }}
        >
          <div className="product-detail-card">
            <button
              className="icon-button"
              style={{ position: 'absolute', top: '18px', right: '18px' }}
              aria-label="Close product details"
              onClick={() => setSelectedProductDetail(null)}
            >
              ×
            </button>

            {/* Artwork thumbnail */}
            <div className="detail-art-box">
              {renderProductArt(selectedProductDetail)}
            </div>

            <div className="detail-meta-row">
              <span>{selectedProductDetail.categoryLabel}</span>
              <span>{selectedProductDetail.artIndex}</span>
            </div>

            <h2>{selectedProductDetail.name}</h2>
            <p className="detail-description">{selectedProductDetail.detailedDescription}</p>

            <div className="detail-specs-grid">
              <div className="spec-item">
                <small>Software Compatibility</small>
                <span>{selectedProductDetail.softwareCompatibility.join(', ')}</span>
              </div>
              <div className="spec-item">
                <small>File Format</small>
                <span>{selectedProductDetail.fileFormat}</span>
              </div>
              <div className="spec-item">
                <small>File Download Size</small>
                <span>{selectedProductDetail.fileSize}</span>
              </div>
              <div className="spec-item">
                <small>License Type</small>
                <span>Commercial Client License Included</span>
              </div>
            </div>

            <div className="detail-list-section">
              <h4>What's Included:</h4>
              <ul>
                {selectedProductDetail.whatsIncluded.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="detail-list-section">
              <h4>Installation Instructions:</h4>
              <ol>
                {selectedProductDetail.installationInstructions.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="detail-foot-row">
              <div className="detail-price-box">
                <span className="price-label">Price in INR</span>
                <span className="price-val">{money(selectedProductDetail.price)}</span>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  addToCart(selectedProductDetail);
                  setSelectedProductDetail(null);
                  setIsCartOpen(true);
                }}
              >
                Add to Cart ↗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Information Modal */}
      <div
        className={`checkout-modal ${isCheckoutModalOpen ? 'show' : ''}`}
        id="checkoutModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsCheckoutModalOpen(false);
        }}
      >
        <div className="modal-card">
          <button
            className="icon-button"
            id="closeModal"
            aria-label="Close message"
            onClick={() => setIsCheckoutModalOpen(false)}
          >
            ×
          </button>
          <span className="eyebrow">One last setup step</span>
          <h3 id="modalTitle">Razorpay isn't connected yet.</h3>
          <p>
            This preview has a working product filter and cart, but it does not collect payments or deliver files.
          </p>
          <div className="modal-note">
            For a live store, create the order on a secure server, open Razorpay Checkout from the frontend, verify the payment signature on the server, then deliver the purchased files.
          </div>
          <button
            className="btn btn-primary"
            id="modalOkay"
            onClick={() => setIsCheckoutModalOpen(false)}
          >
            Got it
          </button>
        </div>
      </div>

      {/* Contact Us Modal */}
      <div
        className={`contact-modal ${isContactModalOpen ? 'show' : ''}`}
        id="contactModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contactModalTitle"
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsContactModalOpen(false);
        }}
      >
        <div className="contact-modal-card">
          <button
            className="icon-button"
            id="closeContactModal"
            aria-label="Close modal"
            onClick={() => setIsContactModalOpen(false)}
          >
            ×
          </button>
          <span className="eyebrow">Get in touch</span>
          <h3 id="contactModalTitle" style={{ fontSize: '26px', margin: '14px 0 8px', fontWeight: 900, letterSpacing: '-0.04em' }}>
            Contact PiyushRetention
          </h3>
          <p style={{ margin: '0 0 16px', color: '#66665e', fontSize: '13.5px', lineHeight: 1.6 }}>
            Have questions about digital assets, video editing presets, custom MOGRT templates, or editing collaborations? Reach out directly.
          </p>

          <div className="contact-channels-grid">
            <a
              href={`mailto:${BRAND_EMAIL}`}
              className="contact-channel-card"
            >
              <span className="channel-label">Direct Email</span>
              <span className="channel-value">
                <span>{BRAND_EMAIL}</span>
                <span>↗</span>
              </span>
            </a>

            <a
              href="https://www.instagram.com/piyushretention"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-channel-card"
            >
              <span className="channel-label">Instagram DM</span>
              <span className="channel-value">
                <span>@piyushretention</span>
                <span>↗</span>
              </span>
            </a>
          </div>

          <form className="contact-form" onSubmit={handleContactSubmit}>
            <div className="contact-form-group">
              <label htmlFor="contactName">Your Name</label>
              <input
                id="contactName"
                type="text"
                required
                className="contact-form-input"
                placeholder="e.g. Rahul Sharma"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>

            <div className="contact-form-group">
              <label htmlFor="contactEmail">Your Email</label>
              <input
                id="contactEmail"
                type="email"
                required
                className="contact-form-input"
                placeholder="e.g. rahul@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>

            <div className="contact-form-group">
              <label htmlFor="contactMessage">Message or Asset Inquiry</label>
              <textarea
                id="contactMessage"
                required
                className="contact-form-textarea"
                rows={3}
                placeholder="What can Piyush help you with? (Presets, editing tips, licensing, etc.)"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Send Message ↗
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ color: 'var(--ink)', borderColor: 'var(--line)' }}
                onClick={() => setIsContactModalOpen(false)}
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast Notification */}
      <div
        className={`toast ${showToast ? 'show' : ''}`}
        id="toast"
        role="status"
        aria-live="polite"
      >
        {toastMessage}
      </div>
    </>
  );
}
