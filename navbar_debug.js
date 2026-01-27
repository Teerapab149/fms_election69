  const CinematicNavbar = React.memo(function CinematicNavbar({ onScrollTo, partyName, partyLogoUrl, user }) {
    // const { data: session, status } = useSession(); // Removed local mock
    // We assume if user is present, they are authenticated.
    const status = user ? "authenticated" : "unauthenticated";
    const [scrolled, setScrolled] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [active, setActive] = useState("hero-section");
    const dropdownRef = useRef(null);

    const navItems = useMemo(
      () => [
        { label: "Overview", target: "hero-section" },
        { label: "Mission", target: "vision-section" },
        { label: "Policies", target: "policy-section" },
        { label: "Gallery", target: "gallery-section" },
        { label: "Squad", target: "squad-section" },
        { label: "Vote", target: "vote-section" },
      ],
      []
    );

    useEffect(() => {
      let ticking = false;
      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            setScrolled(window.scrollY > 18);
            ticking = false;
          });
          ticking = true;
        }
      };
      window.addEventListener("scroll", handleScroll, { passive: true });

      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsProfileOpen(false);
      };
      document.addEventListener("mousedown", handleClickOutside);

      // 🔥 Active section spy (ไม่แตะระบบภายใน, อ่าน DOM อย่างเดียว)
      const ids = navItems.map((n) => n.target);
      const io = new IntersectionObserver(
        (entries) => {
          // เลือก entry ที่ใกล้บนสุด/มี ratio สูงสุด
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

          if (visible?.target?.id) {
            setActive((prev) => (prev !== visible.target.id ? visible.target.id : prev));
          }
        },
        { root: null, threshold: [0.18, 0.5], rootMargin: "-10% 0px -60% 0px" } // Deleted some intermediate thresholds to reduce frequency
      );
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) io.observe(el);
      });

      return () => {
        window.removeEventListener("scroll", handleScroll);
        document.removeEventListener("mousedown", handleClickOutside);
        io.disconnect();
      };
    }, [navItems]);

    const handleLogout = useCallback(async () => {
      await signOut({ redirect: false });
      window.location.reload();
    }, []);

    const isLoggedIn = !!user;
    // const user = session?.user; // Already passed as prop

    const onNav = useCallback(
      (target) => {
        setMobileOpen(false);
        onScrollTo?.(target);
      },
      [onScrollTo]
    );

    return (
      <>
        <style jsx global>{`
        :root {
          --nav-glass: rgba(10, 6, 16, 0.48);
          --nav-stroke: rgba(255, 255, 255, 0.10);
          --nav-stroke-2: rgba(255, 255, 255, 0.14);
          --nav-text: rgba(255, 255, 255, 0.86);
          --nav-muted: rgba(255, 255, 255, 0.62);
        }

        .party-nav-wrap {
          padding-top: env(safe-area-inset-top);
        }

        .party-nav-surface {
          background: linear-gradient(
              180deg,
              rgba(0, 0, 0, 0.45),
              rgba(0, 0, 0, 0.18)
            ),
            var(--nav-glass);
          border: 1px solid var(--nav-stroke);
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transform: translateZ(0);
          will-change: transform;
        }

        .party-nav-pill {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.10);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .party-nav-item {
          position: relative;
          border-radius: 9999px;
          padding: 0.55rem 0.85rem;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--nav-muted);
          transition: transform 160ms ease, background 160ms ease, color 160ms ease;
        }
        .party-nav-item:hover {
          color: var(--nav-text);
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-1px);
        }
        .party-nav-item[data-active="1"] {
          color: rgba(255, 255, 255, 0.92);
          background: rgba(255, 255, 255, 0.10);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .party-nav-item[data-active="1"]::after {
          content: "";
          position: absolute;
          left: 14%;
          right: 14%;
          bottom: -7px;
          height: 3px;
          border-radius: 9999px;
          background: linear-gradient(90deg, transparent, var(--party-gold), transparent);
          opacity: 0.9;
          filter: blur(0.2px);
        }

        .party-nav-brand {
          transition: transform 200ms ease, opacity 200ms ease;
        }
        .party-nav-brand:hover {
          transform: translateY(-1px);
          opacity: 1;
        }

        .party-nav-drawer {
          background: rgba(10, 6, 16, 0.72);
          border: 1px solid var(--nav-stroke);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
      `}</style>

        <nav
          data-party-nav="1"
          className={[
            "party-nav-wrap fixed top-0 left-0 right-0 z-[200] transition-all duration-300",
            scrolled ? "py-2" : "py-4",
          ].join(" ")}
        >
          <div className="container mx-auto px-4 sm:px-5 md:px-10">
            <div
              className={[
                "party-nav-surface rounded-[26px] px-4 sm:px-5 py-3",
                scrolled ? "opacity-100" : "opacity-[0.96]",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Brand */}
                <Link href="/" className="party-nav-brand flex items-center gap-3 min-w-[160px] opacity-95">
                  <div className="hidden sm:block">
                    <Image
                      src="/images/logo/fms_logo50_color.png"
                      alt="FMS 50th"
                      width={100}
                      height={100}
                      className="w-auto h-9 object-contain"
                      priority
                    />
                  </div>
                  <div className="hidden sm:block h-7 w-px bg-white/12" />
                  <Image
                    src="/images/logo/FMS_Standard_Logo_PNG.png"
                    alt="FMS Name"
                    width={300}
                    height={80}
                    className="hidden sm:block w-auto h-7 object-contain opacity-90"
                    priority
                  />

                  <div className="sm:ml-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/10 backdrop-blur-md">
                    {partyLogoUrl ? (
                      <span className="relative w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/10">
                        <Image src={partyLogoUrl} alt="party logo" fill className="object-cover" />
                      </span>
                    ) : (
                      <Sparkles size={14} className="text-[var(--party-gold)]" />
                    )}
                    <span className="hidden md:block text-[11px] font-extrabold tracking-[0.18em] uppercase text-white/85 max-w-[220px] truncate">
                      {partyName || "Party"}
                    </span>
                  </div>
                </Link>

                {/* Desktop menu */}
                <div className="hidden lg:flex items-center gap-2 party-nav-pill rounded-full px-3 py-2">
                  <Link href="/" className="p-2 text-white/80 hover:text-white transition-all hover:bg-white/10 rounded-full">
                    <Home size={18} />
                  </Link>
                  <div className="w-px h-4 bg-white/12 mx-1" />
                  {navItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => onNav(item.target)}
                      className="party-nav-item"
                      data-active={active === item.target ? "1" : "0"}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2 sm:gap-3" ref={dropdownRef}>
                  {/* Mobile menu */}
                  <button
                    onClick={() => setMobileOpen((p) => !p)}
                    className="lg:hidden w-11 h-11 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform"
                    aria-label="Menu"
                  >
                    <Menu size={20} />
                  </button>

                  {isLoggedIn ? (
                    <div className="relative">
                      <button
                        onClick={() => setIsProfileOpen((p) => !p)}
                        className={[
                          "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 border",
                          isProfileOpen
                            ? "bg-[var(--party-primary)] border-white/10 text-white"
                            : "bg-white/10 border-white/10 text-white/90 hover:text-white backdrop-blur-md",
                        ].join(" ")}
                        aria-label="Profile"
                      >
                        <User size={20} />
                      </button>

                      {isProfileOpen && (
                        <div className="absolute right-0 top-full mt-3 w-72 rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-black/50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                          <div className="p-5 border-b border-white/10 bg-gradient-to-r from-white/10 to-transparent">
                            <p className="text-sm font-extrabold text-white truncate">{user?.name || "User"}</p>
                            <p className="text-[10px] text-white/70 font-extrabold tracking-widest mt-1 uppercase truncate">
                              {user?.studentId || "authenticated"}
                            </p>
                          </div>
                          <div className="p-2">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 w-full px-4 py-3 text-xs font-extrabold text-red-300 hover:bg-white/5 rounded-xl transition-all"
                            >
                              <LogOut size={16} />
                              ออกจากระบบ
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className="w-11 h-11 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center backdrop-blur-md hover:bg-white/15 active:scale-95 transition-all"
                      aria-label="Login"
                    >
                      <LogIn size={20} />
                    </Link>
                  )}
                </div>
              </div>

              {/* Mobile Drawer */}
              {mobileOpen && (
                <div className="lg:hidden mt-3">
                  <div className="party-nav-drawer rounded-[26px] overflow-hidden">
                    <div className="p-3 flex items-center justify-between border-b border-white/10">
                      <span className="text-xs font-extrabold tracking-[0.25em] uppercase text-white/70">Navigation</span>
                      <button
                        onClick={() => setMobileOpen(false)}
                        className="p-2 rounded-full hover:bg-white/10 text-white active:scale-95 transition-transform"
                        aria-label="Close menu"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="p-3 grid grid-cols-2 gap-2">
                      {navItems.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => onNav(item.target)}
                          className={[
                            "px-4 py-3 rounded-2xl border text-[11px] font-extrabold tracking-[0.22em] uppercase transition-all active:scale-[0.99]",
                            active === item.target
                              ? "bg-white/12 border-white/14 text-white"
                              : "bg-white/8 border-white/10 text-white/80 hover:text-white hover:bg-white/10",
                          ].join(" ")}
                        >
                          {item.label}
                        </button>
                      ))}
                      <Link
                        href="/"
                        className="col-span-2 mt-1 px-4 py-3 rounded-2xl bg-white/8 border border-white/10 text-white/85 text-[11px] font-extrabold tracking-[0.22em] uppercase flex items-center justify-center gap-2 hover:bg-white/10"
                      >
                        <Home size={16} /> Home
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>
      </>
    );
  });
