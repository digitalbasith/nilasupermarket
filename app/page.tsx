"use client";

import {
  ArrowDownRight, ArrowUpRight, BadgeIndianRupee, Banknote, Barcode, Bell,
  Boxes, CalendarDays, ChartNoAxesCombined, Check, ChevronDown, ChevronRight,
  ClipboardList, CreditCard, Download, FileSpreadsheet, Filter, Gauge, Gift,
  Grid2X2, HandCoins, IndianRupee, Landmark, Languages, LayoutDashboard,
  ListFilter, Menu, Minus, MoonStar, MoreHorizontal, Package, PackageCheck,
  PanelLeftClose, PanelLeftOpen, Plus, Printer, ReceiptIndianRupee, RefreshCcw,
  RotateCcw, Search, Settings, ShieldCheck, ShoppingBag, ShoppingBasket,
  Sparkles, Store, Trash2, Truck, Upload, UserRound, Users,
  WalletCards, X, Zap, Cloud, CloudOff, Database, LoaderCircle, LockKeyhole,
  LogIn, LogOut, Mail, type LucideIcon,
} from "lucide-react";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LiveActionModal, type ActionMode } from "@/components/live-action-modal";
import { EnterpriseSuite, type EnterpriseModule } from "@/components/enterprise-suite";
import { syncCatalogToCloud, type CatalogInput } from "@/lib/nila-cloud";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Language = "en" | "ta";
type Section = "dashboard" | "billing" | "sales" | "products" | "inventory" | "purchases" | "accounts" | "reports" | "orders" | "maintenance" | "customers" | "suppliers" | "staff" | "settings";
type Product = { id: string; name: string; tamil: string; category: string; icon: string; unit: string; price: number; mrp: number; stock: number; gst: number; barcode: string; tint: string };
type CartItem = Product & { quantity: number };
type CloudStatus = "checking" | "demo" | "onboarding" | "live";
type AuthMode = "signin" | "signup";
type CloudProductRow = {
  id: string;
  sku: string;
  name_en: string;
  name_ta: string | null;
  unit: string;
  unit_size: number | string;
  selling_price: number | string;
  mrp: number | string;
  current_stock: number | string;
  gst_rate: number | string;
  metadata: { icon?: string; tint?: string } | null;
  categories: { name_en: string } | Array<{ name_en: string }> | null;
  product_barcodes: Array<{ barcode: string; is_primary: boolean }> | null;
};
type SaleRecord = { id: string; invoice_no: string; grand_total: number; tax_total: number; discount_total: number; paid_total: number; balance_due: number; item_count: number; status: string; created_at: string };
type PurchaseRecord = { id: string; purchase_no: string; supplier_invoice_no: string | null; invoice_date: string; subtotal?: number; tax_total?: number; grand_total: number; paid_total: number; balance_due: number; status: string; suppliers: { name?: string } | Array<{ name?: string }> | null };
type CustomerRecord = { id: string; name: string; phone: string | null; email: string | null; loyalty_points: number; lifetime_value: number; outstanding_balance: number; visit_count: number };
type SupplierRecord = { id: string; name: string; phone: string | null; email: string | null; opening_balance: number; credit_days: number; active: boolean };
type StaffRecord = { user_id: string; display_name: string | null; role: string; active: boolean; created_at: string };
type StoreProfile = { name: string; gstin: string; phone: string; email: string; address: string; invoice_prefix: string };

const productsSeed: Product[] = [
  { id: "demo-1", name: "Aavin Full Cream Milk", tamil: "ஆவின் பால்", category: "Dairy", icon: "🥛", unit: "500 ml", price: 32, mrp: 32, stock: 48, gst: 0, barcode: "890123450001", tint: "sky" },
  { id: "demo-2", name: "India Gate Ponni Rice", tamil: "பொன்னி அரிசி", category: "Staples", icon: "🍚", unit: "5 kg", price: 418, mrp: 455, stock: 22, gst: 5, barcode: "890123450002", tint: "amber" },
  { id: "demo-3", name: "Freedom Sunflower Oil", tamil: "சூரியகாந்தி எண்ணெய்", category: "Staples", icon: "🌻", unit: "1 L", price: 148, mrp: 165, stock: 35, gst: 5, barcode: "890123450003", tint: "yellow" },
  { id: "demo-4", name: "Parle-G Gold Biscuits", tamil: "பார்லே-ஜி பிஸ்கட்", category: "Snacks", icon: "🍪", unit: "800 g", price: 92, mrp: 100, stock: 64, gst: 18, barcode: "890123450004", tint: "orange" },
  { id: "demo-5", name: "Tata Salt", tamil: "டாடா உப்பு", category: "Staples", icon: "🧂", unit: "1 kg", price: 27, mrp: 30, stock: 76, gst: 0, barcode: "890123450005", tint: "blue" },
  { id: "demo-6", name: "Surf Excel Matic", tamil: "சர்ஃப் எக்செல்", category: "Home care", icon: "🧺", unit: "2 kg", price: 395, mrp: 430, stock: 16, gst: 18, barcode: "890123450006", tint: "indigo" },
  { id: "demo-7", name: "Sakthi Sambar Powder", tamil: "சக்தி சாம்பார் பொடி", category: "Masala", icon: "🌶️", unit: "200 g", price: 74, mrp: 82, stock: 29, gst: 5, barcode: "890123450007", tint: "red" },
  { id: "demo-8", name: "Colgate Strong Teeth", tamil: "கோல்கேட் பேஸ்ட்", category: "Personal care", icon: "🪥", unit: "200 g", price: 118, mrp: 128, stock: 41, gst: 18, barcode: "890123450008", tint: "rose" },
  { id: "demo-9", name: "Fresh Red Onion", tamil: "சின்ன வெங்காயம்", category: "Fresh", icon: "🧅", unit: "1 kg", price: 54, mrp: 58, stock: 12, gst: 0, barcode: "890123450009", tint: "violet" },
  { id: "demo-10", name: "Nescafé Classic", tamil: "நெஸ்கஃபே காபி", category: "Beverages", icon: "☕", unit: "100 g", price: 318, mrp: 345, stock: 18, gst: 18, barcode: "890123450010", tint: "brown" },
  { id: "demo-11", name: "Britannia Milk Bread", tamil: "பால் பிரெட்", category: "Bakery", icon: "🍞", unit: "400 g", price: 45, mrp: 45, stock: 9, gst: 0, barcode: "890123450011", tint: "cream" },
  { id: "demo-12", name: "Harpic Power Plus", tamil: "ஹார்பிக் கிளீனர்", category: "Home care", icon: "🧴", unit: "1 L", price: 196, mrp: 215, stock: 24, gst: 18, barcode: "890123450012", tint: "teal" },
];

const copy = {
  en: { dashboard: "Overview", billing: "Billing counter", sales: "Sales control", products: "Products", inventory: "Stock control", purchases: "Purchases", accounts: "Accounts", reports: "Reports", orders: "Order management", maintenance: "Maintenance", customers: "Customers", suppliers: "Suppliers", staff: "Staff & roles", settings: "Settings", search: "Search product, barcode or shortcut...", catalog: "Product catalogue", cart: "Current bill", customer: "Walk-in customer", checkout: "Proceed to payment", subtotal: "Subtotal", savings: "Customer savings", tax: "GST included", total: "Amount payable", hold: "Hold bill", clear: "Clear", all: "All items" },
  ta: { dashboard: "முகப்பு", billing: "பில்லிங் கவுன்டர்", sales: "விற்பனை கட்டுப்பாடு", products: "பொருட்கள்", inventory: "ஸ்டாக் கட்டுப்பாடு", purchases: "கொள்முதல்", accounts: "கணக்குகள்", reports: "அறிக்கைகள்", orders: "ஆர்டர் நிர்வாகம்", maintenance: "பராமரிப்பு", customers: "வாடிக்கையாளர்கள்", suppliers: "சப்ளையர்கள்", staff: "ஊழியர்கள் & பொறுப்புகள்", settings: "அமைப்புகள்", search: "பொருள் அல்லது பார்கோடு தேடுங்கள்...", catalog: "பொருள் பட்டியல்", cart: "தற்போதைய பில்", customer: "நேரடி வாடிக்கையாளர்", checkout: "பணம் செலுத்த", subtotal: "மொத்தம்", savings: "வாடிக்கையாளர் சேமிப்பு", tax: "GST உட்பட", total: "செலுத்த வேண்டியது", hold: "பில்லை நிறுத்து", clear: "அழி", all: "அனைத்தும்" },
};

const navTop: Array<{ id: Section; icon: LucideIcon }> = [
  { id: "dashboard", icon: LayoutDashboard }, { id: "billing", icon: ReceiptIndianRupee },
  { id: "sales", icon: RotateCcw }, { id: "purchases", icon: ShoppingBag },
  { id: "accounts", icon: HandCoins }, { id: "inventory", icon: Boxes },
  { id: "products", icon: Package }, { id: "reports", icon: ChartNoAxesCombined },
  { id: "orders", icon: ClipboardList }, { id: "maintenance", icon: Settings },
];
const navManage: Array<{ id: Section; icon: LucideIcon }> = [
  { id: "customers", icon: Users }, { id: "suppliers", icon: Truck },
  { id: "staff", icon: ShieldCheck }, { id: "settings", icon: Settings },
];
const currency = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
const roleLabel = (role: string) => ({ super_admin: "Super Admin", admin: "Administrator", cashier: "Cashier", inventory_manager: "Inventory Manager", accountant: "Accountant", staff: "Staff" }[role] || role);
const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "NS";

function mapCloudProduct(row: CloudProductRow, index: number): Product {
  const category = Array.isArray(row.categories) ? row.categories[0]?.name_en : row.categories?.name_en;
  const primaryBarcode = row.product_barcodes?.find((item) => item.is_primary)?.barcode || row.product_barcodes?.[0]?.barcode || row.sku;
  return {
    id: row.id,
    name: row.name_en,
    tamil: row.name_ta || "",
    category: category || "General",
    icon: row.metadata?.icon || "📦",
    unit: row.unit_size && Number(row.unit_size) !== 1 ? `${row.unit_size} ${row.unit}` : row.unit,
    price: Number(row.selling_price),
    mrp: Number(row.mrp),
    stock: Number(row.current_stock),
    gst: Number(row.gst_rate),
    barcode: primaryBarcode,
    tint: row.metadata?.tint || ["blue", "amber", "green", "violet", "orange"][index % 5],
  };
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? "compact" : ""}`}><div className="brand-mark"><MoonStar size={19} strokeWidth={2.4} /></div>{!compact && <div><strong>NILA</strong><span>SUPERMARKET</span></div>}</div>;
}
function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) { return <span className={`badge badge-${tone}`}>{children}</span>; }

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [section, setSection] = useState<Section>("billing");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [products, setProducts] = useState(productsSeed);
  const [cart, setCart] = useState<CartItem[]>([{ ...productsSeed[0], quantity: 2 }, { ...productsSeed[3], quantity: 1 }, { ...productsSeed[8], quantity: 1 }]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All items");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [mobileBillOpen, setMobileBillOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI" | "Card">("Cash");
  const [cashReceived, setCashReceived] = useState("");
  const [toast, setToast] = useState("");
  const [clock, setClock] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("checking");
  const [cloudError, setCloudError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [ownerSignupAvailable, setOwnerSignupAvailable] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [storeSetupOpen, setStoreSetupOpen] = useState(false);
  const [setupStoreName, setSetupStoreName] = useState("Nila Supermarket");
  const [setupGstin, setSetupGstin] = useState("");
  const [setupPhone, setSetupPhone] = useState("");
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("Nila Supermarket");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("Arun Manager");
  const [userRole, setUserRole] = useState("admin");
  const [saleBusy, setSaleBusy] = useState(false);
  const [invoiceLabel, setInvoiceLabel] = useState("NS-NEW");
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [storeProfile, setStoreProfile] = useState<StoreProfile>({ name: "Nila Supermarket", gstin: "", phone: "", email: "", address: "", invoice_prefix: "NS" });
  const [actionMode, setActionMode] = useState<ActionMode | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const t = copy[language];

  const loadProductsFromCloud = useCallback(async (activeStoreId: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data, error } = await supabase
      .from("products")
      .select("id,sku,name_en,name_ta,unit,unit_size,selling_price,mrp,current_stock,gst_rate,metadata,categories(name_en),product_barcodes(barcode,is_primary)")
      .eq("store_id", activeStoreId)
      .eq("active", true)
      .order("name_en");
    if (error) throw error;
    const liveProducts = ((data ?? []) as unknown as CloudProductRow[]).map(mapCloudProduct);
    setProducts(liveProducts);
    setCart([]);
  }, []);

  const loadWorkspaceRecords = useCallback(async (activeStoreId: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const [salesResult, purchasesResult, customersResult, suppliersResult, staffResult, storeResult] = await Promise.all([
      supabase.from("sales").select("id,invoice_no,grand_total,tax_total,discount_total,paid_total,balance_due,item_count,status,created_at").eq("store_id", activeStoreId).order("created_at", { ascending: false }).limit(1000),
      supabase.from("purchases").select("id,purchase_no,supplier_invoice_no,invoice_date,subtotal,tax_total,grand_total,paid_total,balance_due,status,suppliers(name)").eq("store_id", activeStoreId).order("invoice_date", { ascending: false }).limit(200),
      supabase.from("customers").select("id,name,phone,email,loyalty_points,lifetime_value,outstanding_balance,visit_count").eq("store_id", activeStoreId).eq("active", true).order("name"),
      supabase.from("suppliers").select("id,name,phone,email,opening_balance,credit_days,active").eq("store_id", activeStoreId).eq("active", true).order("name"),
      supabase.from("store_members").select("user_id,display_name,role,active,created_at").eq("store_id", activeStoreId).order("created_at"),
      supabase.from("stores").select("name,gstin,phone,email,address,invoice_prefix").eq("id", activeStoreId).single(),
    ]);
    const firstError = [salesResult.error, purchasesResult.error, customersResult.error, suppliersResult.error, staffResult.error, storeResult.error].find(Boolean);
    if (firstError) throw firstError;
    setSales(((salesResult.data ?? []) as unknown as SaleRecord[]).map((row) => ({ ...row, grand_total: Number(row.grand_total), tax_total: Number(row.tax_total), discount_total: Number(row.discount_total), paid_total: Number(row.paid_total), balance_due: Number(row.balance_due), item_count: Number(row.item_count) })));
    setPurchases(((purchasesResult.data ?? []) as unknown as PurchaseRecord[]).map((row) => ({ ...row, subtotal: Number(row.subtotal || 0), tax_total: Number(row.tax_total || 0), grand_total: Number(row.grand_total), paid_total: Number(row.paid_total), balance_due: Number(row.balance_due) })));
    setCustomers(((customersResult.data ?? []) as unknown as CustomerRecord[]).map((row) => ({ ...row, loyalty_points: Number(row.loyalty_points), lifetime_value: Number(row.lifetime_value), outstanding_balance: Number(row.outstanding_balance), visit_count: Number(row.visit_count) })));
    setSuppliers(((suppliersResult.data ?? []) as unknown as SupplierRecord[]).map((row) => ({ ...row, opening_balance: Number(row.opening_balance), credit_days: Number(row.credit_days) })));
    setStaff((staffResult.data ?? []) as unknown as StaffRecord[]);
    const profile = storeResult.data as { name: string; gstin: string | null; phone: string | null; email: string | null; address: Record<string, unknown> | string | null; invoice_prefix: string };
    const address = typeof profile.address === "string" ? profile.address : profile.address ? Object.values(profile.address).filter(Boolean).join(", ") : "";
    setStoreProfile({ name: profile.name, gstin: profile.gstin || "", phone: profile.phone || "", email: profile.email || "", address, invoice_prefix: profile.invoice_prefix });
    setStoreName(profile.name);
  }, []);

  const loadCloudWorkspace = useCallback(async (userId: string, email = "") => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setCloudStatus("demo"); return; }
    setCloudError("");
    const { data: member, error } = await supabase
      .from("store_members")
      .select("store_id,role,display_name,stores(name)")
      .eq("user_id", userId)
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    setUserEmail(email);
    if (!member) {
      setCloudStatus("onboarding");
      setStoreSetupOpen(true);
      setAuthOpen(false);
      return;
    }
    const storeRelation = member.stores as unknown as { name?: string } | Array<{ name?: string }> | null;
    const linkedStoreName = Array.isArray(storeRelation) ? storeRelation[0]?.name : storeRelation?.name;
    setStoreId(String(member.store_id));
    setStoreName(linkedStoreName || "Nila Supermarket");
    setUserName(member.display_name || email.split("@")[0] || "Nila User");
    setUserRole(String(member.role));
    await Promise.all([
      loadProductsFromCloud(String(member.store_id)),
      loadWorkspaceRecords(String(member.store_id)),
    ]);
    setCloudStatus("live");
    setAuthOpen(false);
    setStoreSetupOpen(false);
  }, [loadProductsFromCloud, loadWorkspaceRecords]);

  useEffect(() => {
    const update = () => { const now = new Date(); setClock(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })); setDateLabel(now.toLocaleDateString(language === "ta" ? "ta-IN" : "en-IN", { day: "2-digit", month: "short", year: "numeric" })); };
    update(); const timer = window.setInterval(update, 30_000); return () => window.clearInterval(timer);
  }, [language]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "F2") { event.preventDefault(); setSection("billing"); window.setTimeout(() => barcodeRef.current?.focus(), 40); } if (event.key === "F4") { event.preventDefault(); setPaymentOpen(true); } if (event.key === "Escape") setPaymentOpen(false); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    supabase.rpc("nila_bootstrap_status").then(({ data, error }) => {
      if (error) { setOwnerSignupAvailable(false); return; }
      const available = data === true;
      setOwnerSignupAvailable(available);
      setAuthMode(available ? "signup" : "signin");
    });
  }, []);
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { window.setTimeout(() => setCloudStatus("demo"), 0); return; }
    let mounted = true;
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;
      if (error) { setCloudError(error.message); setCloudStatus("demo"); return; }
      if (data.session?.user) {
        try { await loadCloudWorkspace(data.session.user.id, data.session.user.email || ""); }
        catch (workspaceError) { setCloudError(workspaceError instanceof Error ? workspaceError.message : "Cloud workspace could not be loaded"); setCloudStatus("demo"); }
      } else {
        setCloudStatus("demo");
        setAuthOpen(true);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setCloudStatus("demo"); setStoreId(null); setProducts(productsSeed); setCart([]); setUserEmail(""); setSales([]); setPurchases([]); setCustomers([]); setSuppliers([]); setStaff([]);
      } else if (session?.user && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
        window.setTimeout(() => loadCloudWorkspace(session.user.id, session.user.email || "").catch((workspaceError) => {
          setCloudError(workspaceError instanceof Error ? workspaceError.message : "Cloud workspace could not be loaded");
        }), 0);
      }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [loadCloudWorkspace]);

  const categories = useMemo(() => ["All items", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const filteredProducts = useMemo(() => { const term = query.trim().toLowerCase(); return products.filter((p) => (category === "All items" || p.category === category) && (!term || `${p.name} ${p.tamil} ${p.barcode}`.toLowerCase().includes(term))); }, [products, query, category]);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const mrpTotal = cart.reduce((sum, item) => sum + item.mrp * item.quantity, 0);
  const savings = mrpTotal - subtotal;
  const tax = cart.reduce((sum, item) => sum + (item.price * item.quantity * item.gst) / (100 + item.gst), 0);
  const roundedTotal = Number(subtotal.toFixed(2));
  const change = Math.max(0, Number(cashReceived || 0) - roundedTotal);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2500); };
  const addToCart = (product: Product) => { setCart((current) => { const found = current.find((item) => item.id === product.id); return found ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }]; }); notify(`${product.name} added`); };
  const updateQuantity = (id: string, delta: number) => setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter((item) => item.quantity > 0));
  const scanBarcode = () => { const product = products.find((item) => item.barcode === barcodeValue.trim()); if (product) { addToCart(product); setBarcodeValue(""); } else notify("Barcode not found — check or add the product"); };
  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setAuthMessage("Cloud configuration is unavailable. Demo mode is still ready."); return; }
    setAuthBusy(true); setAuthMessage(""); setCloudError("");
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            data: { full_name: authName.trim() || "Nila Owner" },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setAuthMessage("Account created. Please confirm the email, then sign in.");
          setAuthMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
        if (error) throw error;
      }
    } catch (authError) {
      setCloudError(authError instanceof Error ? authError.message : "Could not sign in");
    } finally { setAuthBusy(false); }
  };
  const createWorkspace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setAuthBusy(true); setCloudError("");
    try {
      const { data: userResult, error: userError } = await supabase.auth.getUser();
      if (userError || !userResult.user) throw userError || new Error("Please sign in again");
      const { data: newStoreId, error } = await supabase.rpc("create_store", {
        store_name: setupStoreName.trim(),
        store_gstin: setupGstin.trim() || null,
        store_phone: setupPhone.trim() || null,
      });
      if (error) throw error;
      await syncCatalogToCloud(supabase, String(newStoreId), productsSeed);
      await loadCloudWorkspace(userResult.user.id, userResult.user.email || "");
      setOwnerSignupAvailable(false);
      setAuthMode("signin");
      notify("Nila Supermarket cloud workspace is ready");
    } catch (setupError) {
      setCloudError(setupError instanceof Error ? setupError.message : "Store setup failed");
    } finally { setAuthBusy(false); }
  };
  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    setAuthOpen(true); setAuthMode("signin"); notify("Signed out safely");
  };
  const completeSale = async () => {
    if (!cart.length || saleBusy) return;
    if (cloudStatus !== "live" || !storeId) {
      setPaymentOpen(false); setCashReceived(""); setCart([]); setInvoiceLabel("NS-DEMO-0184");
      notify(`Demo sale completed via ${paymentMode} — sign in to save it`); return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSaleBusy(true);
    try {
      const { data, error } = await supabase.rpc("complete_sale", {
        p_store_id: storeId,
        p_customer_id: null,
        p_register_session_id: null,
        p_items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity, discount_amount: 0 })),
        p_payments: [{ method: paymentMode.toLowerCase(), amount: roundedTotal, reference_no: null }],
        p_discount: 0,
        p_notes: null,
      });
      if (error) throw error;
      const result = data as { invoice_no?: string } | null;
      const completedInvoice = result?.invoice_no || "NS-SAVED";
      setPaymentOpen(false); setCashReceived(""); setCart([]); setInvoiceLabel(completedInvoice);
      await Promise.all([loadProductsFromCloud(storeId), loadWorkspaceRecords(storeId)]);
      notify(`Sale ${completedInvoice} saved to Supabase`);
    } catch (saleError) {
      notify(saleError instanceof Error ? saleError.message : "Sale could not be completed");
    } finally { setSaleBusy(false); }
  };
  const openLiveAction = (mode: ActionMode) => {
    if (cloudStatus !== "live" || !storeId) { setAuthMode("signin"); setAuthOpen(true); notify("Sign in to save this action"); return; }
    setActionError(""); setActionMode(mode);
  };
  const handleActionSubmit = async (mode: ActionMode, formData: FormData) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !storeId) return;
    const value = (name: string) => String(formData.get(name) || "").trim();
    const numberValue = (name: string) => Number(value(name) || 0);
    setActionBusy(true); setActionError("");
    try {
      if (mode === "product") {
        await syncCatalogToCloud(supabase, storeId, [{
          name: value("name"), tamil: value("tamil"), barcode: value("barcode"),
          category: value("category"), unit: value("unit"), price: numberValue("price"),
          mrp: numberValue("mrp"), stock: numberValue("stock"), gst: numberValue("gst"),
          icon: "📦", tint: "blue",
        }]);
        await loadProductsFromCloud(storeId);
      } else if (mode === "customer" || mode === "supplier") {
        const table = mode === "customer" ? "customers" : "suppliers";
        const { error } = await supabase.from(table).insert({
          store_id: storeId,
          name: value("name"),
          phone: value("phone") || null,
          email: value("email") || null,
          gstin: value("gstin").toUpperCase() || null,
        });
        if (error) throw error;
        await loadWorkspaceRecords(storeId);
      } else if (mode === "purchase") {
        const { data, error } = await supabase.rpc("receive_purchase", {
          p_store_id: storeId,
          p_supplier_id: value("supplier_id") || null,
          p_supplier_invoice_no: value("supplier_invoice_no") || null,
          p_items: [{
            product_id: value("product_id"), quantity: numberValue("quantity"),
            free_quantity: 0, unit_cost: numberValue("unit_cost"), discount_amount: 0,
            gst_rate: numberValue("gst_rate"), batch_no: value("batch_no") || null,
            expiry_date: null,
          }],
          p_payment_amount: numberValue("payment_amount"),
          p_notes: null,
        });
        if (error) throw error;
        const receipt = data as { purchase_no?: string } | null;
        notify(`Purchase ${receipt?.purchase_no || "saved"} received into stock`);
        await Promise.all([loadProductsFromCloud(storeId), loadWorkspaceRecords(storeId)]);
      } else if (mode === "staff") {
        const { data, error } = await supabase.functions.invoke("invite-staff", { body: {
          store_id: storeId,
          email: value("email"),
          display_name: value("display_name"),
          role: value("role"),
        } });
        if (error) throw error;
        const result = data as { message?: string } | null;
        notify(result?.message || "Staff invitation sent");
        await loadWorkspaceRecords(storeId);
      }
      setActionMode(null);
      if (mode !== "purchase" && mode !== "staff") notify(`${mode[0].toUpperCase()}${mode.slice(1)} saved to Supabase`);
    } catch (actionFailure) {
      setActionError(actionFailure instanceof Error ? actionFailure.message : "This action could not be saved");
    } finally { setActionBusy(false); }
  };
  const saveStoreProfile = async (formData: FormData) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !storeId) { setAuthOpen(true); return; }
    const value = (name: string) => String(formData.get(name) || "").trim();
    const { error } = await supabase.from("stores").update({
      name: value("name"), gstin: value("gstin").toUpperCase() || null,
      phone: value("phone") || null, email: value("email") || null,
      address: value("address") ? { line1: value("address") } : {},
      invoice_prefix: value("invoice_prefix").toUpperCase() || "NS",
    }).eq("id", storeId);
    if (error) { notify(error.message); return; }
    await loadWorkspaceRecords(storeId); notify("Store profile saved securely");
  };
  const exportProducts = () => {
    const rows = [["Product", "Tamil name", "Barcode", "Category", "Unit", "MRP", "Sale price", "Stock", "GST"], ...products.map((p) => [p.name, p.tamil, p.barcode, p.category, p.unit, p.mrp, p.price, p.stock, p.gst])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "nila-supermarket-products.csv"; anchor.click(); URL.revokeObjectURL(url); notify("Product report exported");
  };
  const importExcel = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const { readSheet } = await import("read-excel-file/browser"); const rows = await readSheet(file); if (rows.length < 2) throw new Error("No rows");
      const headers = rows[0].map((item) => String(item ?? "").trim().toLowerCase());
      const at = (row: readonly unknown[], names: string[]) => { const index = headers.findIndex((header) => names.includes(header)); return index >= 0 ? row[index] : null; };
      const imported = rows.slice(1).filter((row) => row.some(Boolean)).map((row, index): Product => ({ id: `import-${Date.now()}-${index}`, name: String(at(row, ["product", "product name", "name"]) || `Imported product ${index + 1}`), tamil: String(at(row, ["tamil", "tamil name"]) || ""), barcode: String(at(row, ["barcode", "ean"]) || `IMP${Date.now()}${index}`), category: String(at(row, ["category"]) || "Imported"), unit: String(at(row, ["unit", "size"]) || "1 unit"), mrp: Number(at(row, ["mrp"]) || 0), price: Number(at(row, ["sale price", "price", "selling price"]) || 0), stock: Number(at(row, ["stock", "quantity", "qty"]) || 0), gst: Number(at(row, ["gst", "tax"]) || 0), icon: "📦", tint: "blue" }));
      if (cloudStatus === "live" && storeId) {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) throw new Error("Cloud connection unavailable");
        await syncCatalogToCloud(supabase, storeId, imported as CatalogInput[]);
        await loadProductsFromCloud(storeId);
        notify(`${imported.length} products imported and saved to Supabase`);
      } else {
        setProducts((current) => [...imported, ...current]);
        notify(`${imported.length} products imported in demo mode`);
      }
    } catch { notify("Could not read this file. Use the Nila product template."); } finally { event.target.value = ""; }
  };
  const refreshEnterpriseData = async () => {
    if (!storeId) return;
    await Promise.all([loadProductsFromCloud(storeId), loadWorkspaceRecords(storeId)]);
  };
  const changeSection = (next: Section) => { setSection(next); setMobileNav(false); };
  const navLabel = (id: Section) => t[id as keyof typeof t] || id;
  const firstName = userName.split(/\s+/)[0] || "Nila";
  const profileInitials = initials(userName);
  const enterpriseModule: EnterpriseModule | null = section === "purchases" ? "purchase"
    : (["sales", "accounts", "inventory", "reports", "maintenance", "orders"] as Section[]).includes(section)
      ? section as EnterpriseModule
      : null;

  return <main className="app-shell">
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""} ${mobileNav ? "is-mobile-open" : ""}`}>
      <div className="sidebar-head"><Logo compact={collapsed} /><button className="icon-button sidebar-toggle" onClick={() => setCollapsed((v) => !v)} aria-label="Toggle navigation">{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button><button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={19} /></button></div>
      <div className="branch-card"><div className="branch-icon"><Store size={17} /></div>{!collapsed && <div><span>Current branch</span><strong>{storeName} · Main Store</strong></div>}{!collapsed && <ChevronDown size={15} />}</div>
      <nav className="sidebar-nav" aria-label="Main navigation"><p className="nav-kicker">{collapsed ? "•••" : "WORKSPACE"}</p>{navTop.map(({ id, icon: Icon }) => <button key={id} className={`nav-item ${section === id ? "active" : ""}`} onClick={() => changeSection(id)} title={navLabel(id)}><Icon size={19} /><span>{navLabel(id)}</span>{id === "billing" && !collapsed && <kbd>F2</kbd>}</button>)}<p className="nav-kicker manage">{collapsed ? "•••" : "MANAGE"}</p>{navManage.map(({ id, icon: Icon }) => <button key={id} className={`nav-item ${section === id ? "active" : ""}`} onClick={() => changeSection(id)} title={navLabel(id)}><Icon size={19} /><span>{navLabel(id)}</span></button>)}</nav>
      <div className="sidebar-footer">{!collapsed && <div className={`sync-card ${cloudStatus !== "live" ? "is-demo" : ""}`}><span className="sync-dot" /><div><strong>{cloudStatus === "live" ? "Supabase sync active" : cloudStatus === "checking" ? "Checking cloud…" : "Demo mode"}</strong><span>{cloudStatus === "live" ? "RLS protected · synced" : "Sign in to save bills"}</span></div>{cloudStatus === "live" ? <Check size={15} /> : <CloudOff size={15} />}</div>}<button className="profile-chip" onClick={() => setAuthOpen(true)}><span className="avatar">{profileInitials}</span>{!collapsed && <><span className="profile-copy"><strong>{userName}</strong><small>{cloudStatus === "live" ? roleLabel(userRole) : "Demo operator"}</small></span><MoreHorizontal size={18} /></>}</button></div>
    </aside>
    {mobileNav && <button className="nav-scrim" aria-label="Close menu" onClick={() => setMobileNav(false)} />}
    <section className={`workspace ${collapsed ? "sidebar-collapsed" : ""}`}>
      <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={21} /></button><div className="page-title"><span>{navLabel(section)}</span><small>{dateLabel} <i /> {clock}</small></div></div><div className="topbar-actions"><div className="global-search"><Search size={17} /><input aria-label="Global search" placeholder={language === "ta" ? "எதையும் தேடுங்கள்..." : "Search anything..."} /><kbd>⌘ K</kbd></div><button className={`cloud-chip cloud-${cloudStatus}`} onClick={() => setAuthOpen(true)}>{cloudStatus === "live" ? <Cloud size={16} /> : <CloudOff size={16} />}<span>{cloudStatus === "live" ? "Live" : cloudStatus === "checking" ? "Connecting" : "Demo"}</span></button><button className="language-switch" onClick={() => setLanguage((v) => v === "en" ? "ta" : "en")}><Languages size={17} /><span>{language === "en" ? "தமிழ்" : "English"}</span></button><button className="icon-button notification"><Bell size={19} /><span /></button><button className="top-avatar" onClick={() => setAuthOpen(true)} aria-label="Open profile">{profileInitials}</button></div></header>

      {section === "billing" && <div className="billing-layout">
        <section className="catalog-panel">
          <div className="billing-banner"><div><span className="eyebrow"><Zap size={14} fill="currentColor" /> FAST CHECKOUT MODE</span><h1>{language === "ta" ? `வணக்கம், ${firstName} 👋` : `Vanakkam, ${firstName} 👋`}</h1><p>{language === "ta" ? "பார்கோடை ஸ்கேன் செய்யுங்கள் அல்லது பொருளைத் தேர்ந்தெடுக்கவும்." : "Scan a barcode or tap a product to add it to the bill."}</p></div><div className="invoice-pill"><span>Invoice</span><strong>#{invoiceLabel}</strong></div></div>
          <div className="scanner-row"><div className="scanner-input"><span className="scanner-icon"><Barcode size={21} /></span><input ref={barcodeRef} value={barcodeValue} onChange={(e) => setBarcodeValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && scanBarcode()} placeholder={t.search} aria-label="Scan barcode" />{barcodeValue && <button onClick={() => setBarcodeValue("")}><X size={16} /></button>}<kbd>Enter</kbd></div><button className="scan-button" onClick={scanBarcode}><Barcode size={18} /> Scan</button></div>
          <div className="category-row">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={category === item ? "active" : ""}>{item === "All items" && <Grid2X2 size={15} />}{item === "All items" ? t.all : item}</button>)}</div>
          <div className="catalog-heading"><div><h2>{t.catalog}</h2><span>{filteredProducts.length} items available</span></div><div className="catalog-tools"><label><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter products" /></label><button className="icon-button"><ListFilter size={18} /></button></div></div>
          <div className="product-grid">{filteredProducts.map((product) => <button className="product-card" key={product.id} onClick={() => addToCart(product)}><span className={`product-visual tint-${product.tint}`}><span>{product.icon}</span>{product.stock <= 12 && <em>Low</em>}</span><span className="product-info"><strong>{language === "ta" && product.tamil ? product.tamil : product.name}</strong><small>{product.unit} · Stock {product.stock}</small></span><span className="product-price"><strong>{currency(product.price)}</strong>{product.mrp > product.price && <small>{currency(product.mrp)}</small>}</span><span className="add-dot"><Plus size={17} /></span></button>)}</div>
          <button className="mobile-bill-trigger" onClick={() => setMobileBillOpen(true)}><span><ShoppingBasket size={18} /> Current bill <b>{cart.reduce((sum, item) => sum + item.quantity, 0)}</b></span><strong>{currency(roundedTotal)} <ChevronRight size={18} /></strong></button>
        </section>
        {mobileBillOpen && <button className="mobile-cart-backdrop" aria-label="Close current bill" onClick={() => setMobileBillOpen(false)} />}
        <aside className={`cart-panel ${mobileBillOpen ? "mobile-open" : ""}`}>
          <div className="cart-head"><div><h2>{t.cart}</h2><span>{cart.reduce((sum, item) => sum + item.quantity, 0)} items · #{invoiceLabel}</span></div><div className="cart-head-actions"><button className="icon-button"><MoreHorizontal size={19} /></button><button className="icon-button mobile-cart-close" aria-label="Close current bill" onClick={() => setMobileBillOpen(false)}><X size={19} /></button></div></div>
          <button className="customer-select"><span className="customer-icon"><UserRound size={18} /></span><span><small>Customer</small><strong>{t.customer}</strong></span><Plus size={17} /></button>
          <div className="cart-items">{cart.length ? cart.map((item) => <article className="cart-item" key={item.id}><span className={`cart-product-icon tint-${item.tint}`}>{item.icon}</span><div className="cart-product-copy"><strong>{language === "ta" && item.tamil ? item.tamil : item.name}</strong><span>{currency(item.price)} × {item.quantity}</span><div className="qty-control"><button onClick={() => updateQuantity(item.id, -1)}><Minus size={13} /></button><strong>{item.quantity}</strong><button onClick={() => updateQuantity(item.id, 1)}><Plus size={13} /></button></div></div><div className="cart-line-price"><strong>{currency(item.price * item.quantity)}</strong><button onClick={() => setCart((current) => current.filter((row) => row.id !== item.id))}><Trash2 size={15} /></button></div></article>) : <div className="empty-cart"><ShoppingBasket size={36} /><strong>Your bill is empty</strong><span>Scan or select a product to begin.</span></div>}</div>
          <button className="offer-row"><span><Gift size={17} /> Add discount or coupon</span><ChevronRight size={17} /></button>
          <div className="totals"><div><span>{t.subtotal}</span><strong>{currency(subtotal)}</strong></div><div className="savings"><span>{t.savings}</span><strong>− {currency(savings)}</strong></div><div><span>{t.tax}</span><strong>{currency(tax)}</strong></div><div className="grand-total"><span>{t.total}<small>Rounded off {currency(roundedTotal - subtotal)}</small></span><strong>{currency(roundedTotal)}</strong></div></div>
          <div className="cart-actions"><button className="secondary-action" onClick={() => notify("Bill held as #H-012")}><RotateCcw size={17} />{t.hold}</button><button className="secondary-action danger" onClick={() => setCart([])}><Trash2 size={17} />{t.clear}</button></div>
          <button className="checkout-button" onClick={() => cart.length && setPaymentOpen(true)} disabled={!cart.length}><span><CreditCard size={19} />{t.checkout}</span><strong>{currency(roundedTotal)} <ChevronRight size={18} /></strong></button><p className="shortcut-hint"><kbd>F4</kbd> Open payment · <kbd>F6</kbd> Print last bill</p>
        </aside>
      </div>}
      {section === "dashboard" && <Dashboard language={language} products={products} sales={sales} live={cloudStatus === "live"} onStartSale={() => setSection("billing")} />}
      {section === "products" && <ProductsView products={products} query={query} setQuery={setQuery} onImport={() => fileRef.current?.click()} onExport={exportProducts} onAdd={() => openLiveAction("product")} />}
      {enterpriseModule && <EnterpriseSuite
        module={enterpriseModule}
        language={language}
        live={cloudStatus === "live"}
        storeId={storeId}
        products={products}
        sales={sales}
        purchases={purchases}
        customers={customers}
        suppliers={suppliers}
        staff={staff}
        onNotify={notify}
        onRefresh={refreshEnterpriseData}
        onNavigate={(next) => changeSection(next as Section)}
        onOpenPurchase={() => openLiveAction("purchase")}
        onRequireSignIn={() => { setAuthMode("signin"); setAuthOpen(true); notify("Sign in to save this operation"); }}
        onSignOut={signOut}
      />}
      {section === "customers" && <DirectoryView kind="customer" records={customers} live={cloudStatus === "live"} onAdd={() => openLiveAction("customer")} />}
      {section === "suppliers" && <DirectoryView kind="supplier" records={suppliers} live={cloudStatus === "live"} onAdd={() => openLiveAction("supplier")} />}
      {section === "staff" && <StaffView records={staff} live={cloudStatus === "live"} onInvite={() => openLiveAction("staff")} />}
      {section === "settings" && <SettingsView language={language} setLanguage={setLanguage} profile={storeProfile} onSave={saveStoreProfile} />}
    </section>
    <input ref={fileRef} className="visually-hidden" type="file" accept=".xlsx,.xls" onChange={importExcel} />
    {actionMode && <LiveActionModal mode={actionMode} products={products.map((product) => ({ id: product.id, name: product.name, price: product.price, gst: product.gst }))} suppliers={suppliers.map((supplier) => ({ id: supplier.id, name: supplier.name }))} busy={actionBusy} error={actionError} onClose={() => setActionMode(null)} onSubmit={handleActionSubmit} />}
    {paymentOpen && <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Complete payment"><button className="modal-backdrop" onClick={() => !saleBusy && setPaymentOpen(false)} /><section className="payment-modal"><div className="modal-head"><div><span className="eyebrow"><ShieldCheck size={13} /> SECURE CHECKOUT</span><h2>Complete payment</h2><p>Invoice #{invoiceLabel} · {cart.length} line items</p></div><button className="icon-button" onClick={() => setPaymentOpen(false)} disabled={saleBusy}><X size={20} /></button></div><div className="payment-total"><span>Amount to collect</span><strong>{currency(roundedTotal)}</strong><small>You saved the customer {currency(savings)}</small></div><div className="payment-modes">{(["Cash", "UPI", "Card"] as const).map((mode) => { const Icon = mode === "Cash" ? Banknote : mode === "UPI" ? Landmark : CreditCard; return <button key={mode} className={paymentMode === mode ? "active" : ""} onClick={() => setPaymentMode(mode)}><Icon size={20} /><strong>{mode}</strong><small>{mode === "Cash" ? "Notes & coins" : mode === "UPI" ? "Scan any UPI" : "Debit / credit"}</small>{paymentMode === mode && <Check size={15} />}</button>; })}</div>{paymentMode === "Cash" ? <div className="cash-box"><label>Cash received<div><IndianRupee size={18} /><input autoFocus inputMode="decimal" value={cashReceived} onChange={(e) => setCashReceived(e.target.value.replace(/[^0-9.]/g, ""))} placeholder={String(roundedTotal)} /></div></label><div className="cash-shortcuts">{[roundedTotal, 500, 1000, 2000].filter((value, index, values) => value >= roundedTotal && values.indexOf(value) === index).map((value) => <button key={value} onClick={() => setCashReceived(String(value))}>{currency(value)}</button>)}</div><div className="change-row"><span>Return change</span><strong>{currency(change)}</strong></div></div> : paymentMode === "UPI" ? <div className="upi-box"><div className="qr-demo"><Grid2X2 size={54} /></div><div><strong>Scan to pay {currency(roundedTotal)}</strong><span>Waiting for payment confirmation…</span><p><span className="pulse-dot" /> Nila Supermarket UPI</p></div></div> : <div className="terminal-box"><CreditCard size={32} /><div><strong>Card terminal ready</strong><span>Ask the customer to tap, insert or swipe.</span></div><RefreshCcw size={18} className="spin" /></div>}<button className="complete-payment" onClick={completeSale} disabled={saleBusy}>{saleBusy ? <LoaderCircle size={19} className="spin" /> : <Check size={19} />} {saleBusy ? "Saving secure sale…" : `Confirm ${paymentMode} payment`} <span>{currency(roundedTotal)}</span></button><p className="modal-note"><Printer size={14} /> {cloudStatus === "live" ? "Sale, stock and audit trail will update together" : "Demo receipt · sign in to save to cloud"}</p></section></div>}
    {authOpen && <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Nila cloud access"><button className="modal-backdrop" onClick={() => setAuthOpen(false)} /><section className="auth-modal">
      <div className="auth-brand"><Logo /><button className="icon-button" onClick={() => setAuthOpen(false)} aria-label="Close"><X size={19} /></button></div>
      {cloudStatus === "live" ? <div className="account-panel"><span className="account-avatar">{profileInitials}</span><span className="eyebrow"><Cloud size={13} /> CLOUD ACCOUNT</span><h2>{userName}</h2><p>{userEmail}</p><div className="account-meta"><span><Store size={16} />{storeName}</span><span><ShieldCheck size={16} />{roleLabel(userRole)}</span><span><Database size={16} />Supabase connected</span></div><button className="signout-button" onClick={signOut}><LogOut size={17} /> Sign out from this device</button></div> : <>
        <div className="auth-intro"><span className="auth-icon"><LockKeyhole size={22} /></span><span className="eyebrow">SECURE SUPERMARKET CLOUD</span><h2>{authMode === "signup" ? "Create the owner account" : "Welcome back"}</h2><p>{authMode === "signup" ? "Use your new email ID. Your first account becomes Super Admin for Nila Supermarket." : "Sign in to continue billing, products, stock and reports."}</p></div>
        <div className={`auth-tabs ${ownerSignupAvailable ? "" : "signin-only"}`}>{ownerSignupAvailable && <button className={authMode === "signup" ? "active" : ""} onClick={() => { setAuthMode("signup"); setCloudError(""); setAuthMessage(""); }}>Create owner</button>}<button className={authMode === "signin" ? "active" : ""} onClick={() => { setAuthMode("signin"); setCloudError(""); setAuthMessage(""); }}>Sign in</button></div>
        <form className="auth-form" onSubmit={submitAuth}>{authMode === "signup" && <label><span>Owner name</span><div><UserRound size={17} /><input value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder="Your name" autoComplete="name" required /></div></label>}<label><span>Email ID</span><div><Mail size={17} /><input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="owner@nilasupermarket.in" autoComplete="email" required /></div></label><label><span>Password</span><div><LockKeyhole size={17} /><input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="Minimum 6 characters" autoComplete={authMode === "signup" ? "new-password" : "current-password"} minLength={6} required /></div></label>{cloudError && <p className="auth-alert error">{cloudError}</p>}{authMessage && <p className="auth-alert success">{authMessage}</p>}<button className="auth-submit" disabled={authBusy}>{authBusy ? <LoaderCircle size={18} className="spin" /> : <LogIn size={18} />}{authBusy ? "Please wait…" : authMode === "signup" ? "Create owner account" : "Sign in securely"}</button></form>
        <button className="demo-link" onClick={() => setAuthOpen(false)}>Explore the interface in demo mode</button><p className="auth-security"><ShieldCheck size={14} /> Passwords are handled by Supabase Auth. The app never stores them.</p>
      </>}
    </section></div>}
    {storeSetupOpen && <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Create supermarket workspace"><div className="modal-backdrop" /><section className="auth-modal setup-modal"><div className="auth-intro"><span className="auth-icon"><Database size={22} /></span><span className="eyebrow">FIRST-TIME SETUP</span><h2>Create your Nila workspace</h2><p>This creates the store, your Super Admin role and a starter product catalogue.</p></div><form className="auth-form" onSubmit={createWorkspace}><label><span>Supermarket name</span><div><Store size={17} /><input value={setupStoreName} onChange={(event) => setSetupStoreName(event.target.value)} required /></div></label><div className="auth-form-row"><label><span>GSTIN (optional)</span><div><FileSpreadsheet size={17} /><input value={setupGstin} onChange={(event) => setSetupGstin(event.target.value.toUpperCase())} placeholder="33ABCDE1234F1Z5" /></div></label><label><span>Phone (optional)</span><div><UserRound size={17} /><input value={setupPhone} onChange={(event) => setSetupPhone(event.target.value)} placeholder="+91" /></div></label></div>{cloudError && <p className="auth-alert error">{cloudError}</p>}<button className="auth-submit" disabled={authBusy}>{authBusy ? <LoaderCircle size={18} className="spin" /> : <Sparkles size={18} />}{authBusy ? "Preparing secure workspace…" : "Create Nila Supermarket"}</button></form><button className="demo-link" onClick={signOut}>Use another email account</button></section></div>}
    {toast && <div className="toast"><span><Check size={15} /></span>{toast}</div>}
  </main>;
}

function Dashboard({ language, onStartSale, products, sales, live }: { language: Language; onStartSale: () => void; products: Product[]; sales: SaleRecord[]; live: boolean }) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const localDate = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(iso));
  const todaySales = sales.filter((sale) => localDate(sale.created_at) === today && sale.status === "completed");
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.grand_total, 0);
  const todayTax = todaySales.reduce((sum, sale) => sum + sale.tax_total, 0);
  const lowStock = products.filter((product) => product.stock <= 12);
  const lastSeven = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date); return { key, label: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Asia/Kolkata" }).format(date), total: sales.filter((sale) => localDate(sale.created_at) === key && sale.status === "completed").reduce((sum, sale) => sum + sale.grand_total, 0) }; });
  const weekTotal = lastSeven.reduce((sum, day) => sum + day.total, 0);
  const peak = Math.max(...lastSeven.map((day) => day.total), 1);
  const stats = live ? [
    { label: "Today’s sales", value: currency(todayRevenue), delta: `${todaySales.length} completed bills`, icon: BadgeIndianRupee, tone: "blue" },
    { label: "Bills created", value: String(todaySales.length), delta: `${todaySales.reduce((sum, sale) => sum + sale.item_count, 0)} items sold`, icon: ReceiptIndianRupee, tone: "violet" },
    { label: "GST collected", value: currency(todayTax), delta: "Calculated from live bills", icon: Landmark, tone: "green" },
    { label: "Low stock items", value: String(lowStock.length), delta: lowStock.length ? "Needs action" : "Stock healthy", icon: PackageCheck, tone: "orange" },
  ] : [
    { label: "Today’s sales", value: "₹86,420", delta: "Demo data", icon: BadgeIndianRupee, tone: "blue" },
    { label: "Bills created", value: "184", delta: "Demo data", icon: ReceiptIndianRupee, tone: "violet" },
    { label: "GST collected", value: "₹8,760", delta: "Demo data", icon: Landmark, tone: "green" },
    { label: "Low stock items", value: "17", delta: "Demo data", icon: PackageCheck, tone: "orange" },
  ];
  const visibleStock = (live ? lowStock : productsSeed.filter((product) => product.stock <= 18)).slice(0, 4);
  return <div className="content-view dashboard-view"><section className="welcome-card"><div><span className="eyebrow"><Sparkles size={14} /> {live ? "LIVE STORE OVERVIEW" : "DEMO STORE OVERVIEW"}</span><h1>{language === "ta" ? "வணக்கம்!" : "Good morning!"}</h1><p>{live ? "This dashboard is calculated from your protected Supabase records." : language === "ta" ? "Cloud கணக்கில் உள்நுழையவும்; இப்போது மாதிரி தரவு காட்டப்படுகிறது." : "Sign in to see live store totals. Sample data is shown for preview."}</p></div><button className="primary-button" onClick={onStartSale}><Plus size={18} /> Start new sale <kbd>F2</kbd></button></section><div className="stats-grid">{stats.map(({ label, value, delta, icon: Icon, tone }) => <article className="stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={21} /></div><span>{label}</span><strong>{value}</strong><small className={tone === "orange" ? "attention" : "positive"}>{tone === "orange" ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{delta}</small></article>)}</div><div className="dashboard-grid"><section className="panel sales-chart"><div className="panel-head"><div><h2>Sales performance</h2><span>Revenue across the last 7 days</span></div><button className="range-button">This week <ChevronDown size={15} /></button></div><div className="chart-summary"><strong>{live ? currency(weekTotal) : "₹4,82,360"}</strong><Badge tone={live ? "blue" : "neutral"}>{live ? "Live" : "Demo"}</Badge></div><div className="bar-chart">{(live ? lastSeven.map((day) => ({ d: day.label, v: Math.max(4, Math.round(day.total / peak * 100)) })) : [{ d: "Mon", v: 44 }, { d: "Tue", v: 62 }, { d: "Wed", v: 52 }, { d: "Thu", v: 76 }, { d: "Fri", v: 68 }, { d: "Sat", v: 93 }, { d: "Sun", v: 81 }]).map((bar) => <div key={bar.d}><span style={{ height: `${bar.v}%` }}><i /></span><small>{bar.d}</small></div>)}</div></section><section className="panel tender-panel"><div className="panel-head"><div><h2>Today’s collection</h2><span>{live ? "Completed sales" : "Sample payment mix"}</span></div><MoreHorizontal size={19} /></div><div className="donut-row"><div className="donut"><span>{live ? currency(todayRevenue) : "₹86.4K"}<small>Total</small></span></div><div className="legend">{live ? <><p><i className="upi" /><span>Bills</span><strong>{todaySales.length}</strong></p><p><i className="cash" /><span>Paid</span><strong>{currency(todaySales.reduce((sum, sale) => sum + sale.paid_total, 0))}</strong></p><p><i className="card" /><span>Due</span><strong>{currency(todaySales.reduce((sum, sale) => sum + sale.balance_due, 0))}</strong></p></> : <><p><i className="upi" /><span>UPI</span><strong>52%</strong></p><p><i className="cash" /><span>Cash</span><strong>34%</strong></p><p><i className="card" /><span>Card</span><strong>14%</strong></p></>}</div></div></section><section className="panel low-stock-panel"><div className="panel-head"><div><h2>Low stock alert</h2><span>Reorder before stock-out</span></div><button>View all <ChevronRight size={15} /></button></div>{visibleStock.length ? visibleStock.map((product) => <div className="stock-row" key={product.id}><span className={`cart-product-icon tint-${product.tint}`}>{product.icon}</span><div><strong>{product.name}</strong><small>{product.category} · {product.unit}</small></div><span className="stock-count"><strong>{product.stock}</strong><small>left</small></span><button>Reorder</button></div>) : <div className="panel-empty"><PackageCheck size={22} /><span>No low-stock products</span></div>}</section><section className="panel activity-panel"><div className="panel-head"><div><h2>Recent sales</h2><span>{live ? "Live counter records" : "Sample counter updates"}</span></div><span className="live-badge"><i /> {live ? "Live" : "Demo"}</span></div>{(live ? sales.slice(0, 4).map((sale) => [sale.invoice_no, sale.status, currency(sale.grand_total), new Date(sale.created_at).toLocaleString("en-IN")]) : [["NS-0183", "Cash sale", "₹1,248", "2 min ago"], ["NS-0182", "UPI sale", "₹864", "6 min ago"], ["NS-0181", "Card sale", "₹2,116", "18 min ago"]]).map((row) => <div className="activity-row" key={row[0]}><span className="activity-icon"><ReceiptIndianRupee size={16} /></span><div><strong>{row[0]} · {row[1]}</strong><small>{row[3]}</small></div><b>{row[2]}</b></div>)}</section></div></div>;
}

function ViewHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) { return <header className="view-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{actions && <div className="view-actions">{actions}</div>}</header>; }

function ProductsView({ products, query, setQuery, onImport, onExport, onAdd }: { products: Product[]; query: string; setQuery: (value: string) => void; onImport: () => void; onExport: () => void; onAdd: () => void }) {
  return <div className="content-view"><ViewHeader eyebrow="MASTER CATALOGUE" title="Product management" description={`${products.length} active products across ${new Set(products.map((product) => product.category)).size} categories`} actions={<><button className="outline-button" onClick={onImport}><Upload size={17} /> Upload Excel</button><button className="outline-button" onClick={onExport}><Download size={17} /> Export</button><button className="primary-button" onClick={onAdd}><Plus size={17} /> Add product</button></>} /><div className="data-toolbar"><label className="table-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, barcode, SKU..." /></label><button className="filter-button"><Filter size={17} /> Category: All <ChevronDown size={15} /></button><button className="filter-button"><Boxes size={17} /> Stock: All <ChevronDown size={15} /></button><span className="toolbar-spacer" /><button className="icon-button"><RefreshCcw size={17} /></button><button className="icon-button"><MoreHorizontal size={17} /></button></div><div className="data-table product-table"><div className="table-row table-head-row"><span><input type="checkbox" /></span><span>Product</span><span>Barcode / SKU</span><span>Category</span><span>Price</span><span>Stock</span><span>GST</span><span>Status</span><span /></div>{products.filter((p) => `${p.name} ${p.barcode}`.toLowerCase().includes(query.toLowerCase())).map((p) => <div className="table-row" key={p.id}><span><input type="checkbox" /></span><span className="table-product"><i className={`tint-${p.tint}`}>{p.icon}</i><span><strong>{p.name}</strong><small>{p.tamil} · {p.unit}</small></span></span><span><strong>{p.barcode}</strong><small>{p.id.startsWith("demo-") ? p.id.toUpperCase() : p.id.slice(0, 8).toUpperCase()}</small></span><span>{p.category}</span><span><strong>{currency(p.price)}</strong><small>MRP {currency(p.mrp)}</small></span><span><strong>{p.stock}</strong><small>Min. {Math.min(10, p.stock)}</small></span><span>{p.gst}%</span><span><Badge tone={p.stock <= 12 ? "orange" : "green"}>{p.stock <= 12 ? "Low stock" : "Active"}</Badge></span><span><button className="icon-button"><MoreHorizontal size={17} /></button></span></div>)}</div><div className="table-footer"><span>Showing {products.length} of {products.length} products</span><div><button disabled><ChevronRight size={16} className="flip" /></button><button className="active">1</button><button disabled><ChevronRight size={16} /></button></div></div></div>;
}

/* eslint-disable @typescript-eslint/no-unused-vars -- retained as a rollback-safe legacy presentation while enterprise modules are rolled out */
function InventoryView({ products }: { products: Product[] }) {
  const stockValue = products.reduce((sum, product) => sum + product.price * Math.max(product.stock, 0), 0);
  const healthy = products.filter((product) => product.stock > 12).length;
  const low = products.filter((product) => product.stock > 0 && product.stock <= 12).length;
  const out = products.filter((product) => product.stock <= 0).length;
  const healthRows: Array<[string, number, number, string]> = [["Healthy stock", healthy, products.length ? Math.round(healthy / products.length * 100) : 0, "green"], ["Low stock", low, products.length ? Math.round(low / products.length * 100) : 0, "orange"], ["Out of stock", out, products.length ? Math.round(out / products.length * 100) : 0, "red"]];
  return <div className="content-view"><ViewHeader eyebrow="LIVE INVENTORY" title="Stock control" description="Current stock, reorder visibility and purchase receipts across your store" actions={<><button className="outline-button"><ClipboardList size={17} /> Stock audit</button><button className="primary-button"><Plus size={17} /> Stock adjustment</button></>} /><div className="mini-stats"><article><Boxes size={20} /><span>Retail stock value<strong>{currency(stockValue)}</strong></span><Badge tone="blue">Live qty</Badge></article><article><PackageCheck size={20} /><span>Healthy stock<strong>{healthy} SKUs</strong></span><Badge tone="green">{products.length ? Math.round(healthy / products.length * 100) : 0}%</Badge></article><article><BadgeIndianRupee size={20} /><span>Low stock<strong>{low} SKUs</strong></span><Badge tone="orange">Action</Badge></article><article><CalendarDays size={20} /><span>Out of stock<strong>{out} SKUs</strong></span><Badge tone={out ? "red" : "green"}>{out ? "Reorder" : "Healthy"}</Badge></article></div><div className="inventory-grid"><section className="panel inventory-summary"><div className="panel-head"><div><h2>Inventory health</h2><span>Products by stock position</span></div><button className="range-button">All categories <ChevronDown size={15} /></button></div>{healthRows.map(([label, count, width, tone]) => <div className="health-row" key={label}><div><span>{label}</span><strong>{count}</strong></div><span className="health-track"><i className={tone} style={{ width: `${Math.max(width, count ? 4 : 0)}%` }} /></span></div>)}</section><section className="panel reorder-card"><div className="panel-head"><div><h2>Smart reorder list</h2><span>Products at or below 12 units</span></div><Sparkles size={19} /></div>{products.filter((product) => product.stock <= 12).slice(0, 8).map((product) => <div className="reorder-row" key={product.id}><span>{product.icon}</span><div><strong>{product.name}</strong><small>{product.stock} left · {product.category}</small></div><strong>{Math.max(24, 50 - product.stock)} units</strong><button><Plus size={15} /> PO</button></div>)}{!products.some((product) => product.stock <= 12) && <div className="panel-empty"><PackageCheck size={22} /><span>Reorder list is clear</span></div>}</section></div></div>;
}

function PurchasesView({ records, live, onAdd }: { records: PurchaseRecord[]; live: boolean; onAdd: () => void }) {
  const monthKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);
  const monthRecords = records.filter((record) => record.invoice_date.startsWith(monthKey));
  const monthTotal = monthRecords.reduce((sum, record) => sum + record.grand_total, 0);
  const dueTotal = records.reduce((sum, record) => sum + record.balance_due, 0);
  const rows = live ? records : ([
    { id: "demo-po-1", purchase_no: "PO-0092", supplier_invoice_no: "INV-4502", invoice_date: "2026-08-16", grand_total: 24650, paid_total: 24650, balance_due: 0, status: "received", suppliers: { name: "Sri Lakshmi Distributors" } },
    { id: "demo-po-2", purchase_no: "PO-0091", supplier_invoice_no: "AAV-812", invoice_date: "2026-08-16", grand_total: 8940, paid_total: 8940, balance_due: 0, status: "received", suppliers: { name: "Aavin Cuddalore Depot" } },
    { id: "demo-po-3", purchase_no: "PO-0090", supplier_invoice_no: "MRM-305", invoice_date: "2026-08-15", grand_total: 42800, paid_total: 20000, balance_due: 22800, status: "part_received", suppliers: { name: "Murugan Rice Mandi" } },
  ] as PurchaseRecord[]);
  return <div className="content-view"><ViewHeader eyebrow={live ? "LIVE PROCUREMENT" : "PROCUREMENT · DEMO"} title="Purchase management" description="Receive purchases and update product stock in one protected transaction" actions={<><button className="outline-button"><Upload size={17} /> Import bill</button><button className="primary-button" onClick={onAdd}><Plus size={17} /> Receive purchase</button></>} /><div className="mini-stats"><article><ShoppingBag size={20} /><span>This month<strong>{live ? currency(monthTotal) : "₹6,84,240"}</strong></span><Badge tone="blue">{live ? `${monthRecords.length} bills` : "Demo"}</Badge></article><article><Truck size={20} /><span>Received bills<strong>{live ? records.filter((record) => record.status === "received").length : 42}</strong></span><Badge tone="green">Stock posted</Badge></article><article><HandCoins size={20} /><span>Supplier due<strong>{live ? currency(dueTotal) : "₹1,48,600"}</strong></span><Badge tone={dueTotal > 0 ? "red" : "green"}>{live ? `${records.filter((record) => record.balance_due > 0).length} bills` : "Demo"}</Badge></article><article><RotateCcw size={20} /><span>Data source<strong>{live ? "Supabase" : "Preview"}</strong></span><Badge tone={live ? "green" : "neutral"}>{live ? "Live" : "Demo"}</Badge></article></div><div className="data-table purchase-table"><div className="table-row table-head-row"><span>Purchase bill</span><span>Supplier</span><span>Invoice date</span><span>Invoice ref.</span><span>Amount</span><span>Payment</span><span>Status</span><span /></div>{rows.map((record) => { const relation = record.suppliers; const supplierName = Array.isArray(relation) ? relation[0]?.name : relation?.name; return <div className="table-row" key={record.id}><span><strong>{record.purchase_no}</strong><small>Stock receipt recorded</small></span><span><strong>{supplierName || "Unregistered supplier"}</strong></span><span>{new Date(`${record.invoice_date}T00:00:00`).toLocaleDateString("en-IN")}</span><span>{record.supplier_invoice_no || "—"}</span><span><strong>{currency(record.grand_total)}</strong></span><span>{record.balance_due > 0 ? `${currency(record.balance_due)} due` : "Paid"}</span><span><Badge tone={record.status === "received" ? "green" : "orange"}>{record.status.replaceAll("_", " ")}</Badge></span><span><button className="icon-button"><MoreHorizontal size={17} /></button></span></div>; })}{live && !rows.length && <div className="table-empty"><ShoppingBag size={24} /><strong>No purchases yet</strong><span>Receive the first supplier bill to increase stock.</span></div>}</div></div>;
}

function ReportsView({ sales, live, onExport }: { sales: SaleRecord[]; live: boolean; onExport: (from: string, to: string) => void }) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const [fromDate, setFromDate] = useState(`${today.slice(0, 8)}01`);
  const [toDate, setToDate] = useState(today);
  const localDate = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(iso));
  const filtered = sales.filter((sale) => { const day = localDate(sale.created_at); return day >= fromDate && day <= toDate && sale.status === "completed"; });
  const netSales = filtered.reduce((sum, sale) => sum + sale.grand_total, 0);
  const taxTotal = filtered.reduce((sum, sale) => sum + sale.tax_total, 0);
  const itemsSold = filtered.reduce((sum, sale) => sum + sale.item_count, 0);
  const averageBill = filtered.length ? netSales / filtered.length : 0;
  const daily = Array.from(new Set(filtered.map((sale) => localDate(sale.created_at)))).sort().slice(-16).map((date) => ({ date, total: filtered.filter((sale) => localDate(sale.created_at) === date).reduce((sum, sale) => sum + sale.grand_total, 0) }));
  const peak = Math.max(...daily.map((day) => day.total), 1);
  const demoBars = [58, 72, 64, 81, 74, 90, 66, 78, 94, 88, 70, 84, 77, 96, 86, 92];
  return <div className="content-view"><ViewHeader eyebrow={live ? "LIVE BUSINESS INTELLIGENCE" : "BUSINESS INTELLIGENCE · DEMO"} title="Reports & insights" description="Choose any date range and export invoice-wise sales, GST and payment totals" actions={<><label className="date-control"><CalendarDays size={16} /><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /><span>to</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label><button className="primary-button" onClick={() => onExport(fromDate, toDate)}><Download size={17} /> Export CSV</button></>} /><div className="report-tabs"><button className="active">Sales</button><button>GST</button><button>Stock</button><button>Purchases</button><button>Cashier</button></div><div className="stats-grid report-stats"><article className="stat-card"><span>Net sales</span><strong>{live ? currency(netSales) : "₹12,86,420"}</strong><small className="positive"><ArrowUpRight size={14} />{live ? `${filtered.length} invoices` : "Demo data"}</small></article><article className="stat-card"><span>GST total</span><strong>{live ? currency(taxTotal) : "₹1,18,760"}</strong><small className="positive"><Landmark size={14} />Included tax</small></article><article className="stat-card"><span>Average bill</span><strong>{live ? currency(averageBill) : "₹486.20"}</strong><small>{live ? "Selected period" : "Demo data"}</small></article><article className="stat-card"><span>Items sold</span><strong>{live ? itemsSold : "8,742"}</strong><small>{live ? `${filtered.length} transactions` : "Demo data"}</small></article></div><div className="dashboard-grid"><section className="panel sales-chart wide-chart"><div className="panel-head"><div><h2>Daily sales trend</h2><span>{fromDate} — {toDate}</span></div><div className="chart-key"><span><i className="sales" />Sales</span><span><i className="profit" />GST</span></div></div><div className="report-bars">{(live ? daily.map((day) => ({ label: day.date.slice(8), value: Math.max(4, Math.round(day.total / peak * 100)) })) : demoBars.map((value, index) => ({ label: String(index + 1), value }))).map((bar) => <span key={`${bar.label}-${bar.value}`}><i style={{ height: `${bar.value}%` }} /><b style={{ height: `${Math.round(bar.value * .18)}%` }} /><small>{bar.label}</small></span>)}</div>{live && !daily.length && <div className="chart-empty">No completed sales in this date range</div>}</section><section className="panel top-products"><div className="panel-head"><div><h2>{live ? "Top invoices" : "Top selling products"}</h2><span>By net revenue</span></div><button>View all <ChevronRight size={15} /></button></div>{live ? [...filtered].sort((a, b) => b.grand_total - a.grand_total).slice(0, 5).map((sale, index) => <div className="rank-row" key={sale.id}><span>{index + 1}</span><i className="tint-blue"><ReceiptIndianRupee size={16} /></i><div><strong>{sale.invoice_no}</strong><small>{sale.item_count} items · {localDate(sale.created_at)}</small></div><b>{currency(sale.grand_total)}</b></div>) : productsSeed.slice(0, 5).map((product, index) => <div className="rank-row" key={product.id}><span>{index + 1}</span><i className={`tint-${product.tint}`}>{product.icon}</i><div><strong>{product.name}</strong><small>{284 - index * 31} units sold</small></div><b>{currency(product.price * (284 - index * 31))}</b></div>)}</section></div><div className="report-library"><h2>Ready-to-export reports</h2><div>{[["Sales register", "Invoice-wise sales with payment and tax", ReceiptIndianRupee], ["GST summary", "Tax totals for the chosen date range", Landmark], ["Stock ledger", "Opening, inward, outward and closing", Boxes], ["Purchase register", "Supplier invoice and input tax details", ShoppingBag], ["Cashier closing", "Shift-wise tender reconciliation", UserRound]].map(([title, desc, Icon]) => { const ReportIcon = Icon as LucideIcon; return <button key={String(title)} onClick={() => onExport(fromDate, toDate)}><span><ReportIcon size={19} /></span><div><strong>{String(title)}</strong><small>{String(desc)}</small></div><Download size={17} /></button>; })}</div></div></div>;
}

/* eslint-enable @typescript-eslint/no-unused-vars */
function DirectoryView({ kind, records, live, onAdd }: { kind: "customer" | "supplier"; records: CustomerRecord[] | SupplierRecord[]; live: boolean; onAdd: () => void }) {
  const supplier = kind === "supplier";
  const demoRows = supplier ? [["Sri Lakshmi Distributors", "FMCG supplier", "+91 98420 66142", "₹82,400 due", "Demo"], ["Aavin Cuddalore Depot", "Dairy supplier", "+91 94432 10884", "₹12,860 due", "Demo"], ["Murugan Rice Mandi", "Rice & staples", "+91 97888 42016", "₹42,800 due", "Demo"]] : [["R. Kavitha", "Gold member · 42 visits", "+91 98424 55218", "₹18,420 spent", "640 points"], ["S. Karthikeyan", "Member · 28 visits", "+91 97872 41190", "₹12,860 spent", "380 points"], ["Priya Stores", "Business · 16 visits", "+91 94433 08612", "₹42,800 spent", "₹4,200 due"]];
  const rows = live ? (supplier ? (records as SupplierRecord[]).map((record) => [record.name, `${record.credit_days} credit days`, record.phone || "No phone", currency(record.opening_balance), record.active ? "Active" : "Inactive"]) : (records as CustomerRecord[]).map((record) => [record.name, `${record.visit_count} visits`, record.phone || "No phone", currency(record.lifetime_value), record.outstanding_balance > 0 ? `${currency(record.outstanding_balance)} due` : `${record.loyalty_points} points`])) : demoRows;
  return <div className="content-view"><ViewHeader eyebrow={`${supplier ? "VENDOR NETWORK" : "CUSTOMER CRM"}${live ? " · LIVE" : " · DEMO"}`} title={supplier ? "Supplier management" : "Customer directory"} description={supplier ? "Contacts, purchasing and opening balance tracking" : "Loyalty, credit and purchase history in one view"} actions={<button className="primary-button" onClick={onAdd}><Plus size={17} /> Add {kind}</button>} /><div className="data-toolbar"><label className="table-search"><Search size={17} /><input placeholder={`Search ${kind} name or phone...`} /></label><button className="filter-button"><Filter size={17} /> All {supplier ? "suppliers" : "customers"}<ChevronDown size={15} /></button><span className="toolbar-spacer" /><button className="outline-button"><Upload size={16} /> Import</button><button className="outline-button"><Download size={16} /> Export</button></div><div className="directory-grid">{rows.map((row, index) => <article className="directory-card" key={`${row[0]}-${index}`}><div className={`directory-avatar avatar-${index % 4 + 1}`}>{row[0].split(" ").map((word) => word[0]).slice(0, 2).join("")}</div><div className="directory-title"><strong>{row[0]}</strong><span>{row[1]}</span></div><button className="icon-button"><MoreHorizontal size={17} /></button><div className="directory-meta"><p><span>Phone</span><strong>{row[2]}</strong></p><p><span>{supplier ? "Opening balance" : "Lifetime value"}</span><strong>{row[3]}</strong></p></div><div className="directory-foot"><Badge tone={row[4].includes("due") ? "orange" : live ? "green" : "neutral"}>{row[4]}</Badge><button>View profile <ChevronRight size={15} /></button></div></article>)}{live && !rows.length && <div className="directory-empty"><Users size={26} /><strong>No {supplier ? "suppliers" : "customers"} yet</strong><span>Use Add {kind} to create the first record.</span></div>}</div></div>;
}

function StaffView({ records, live, onInvite }: { records: StaffRecord[]; live: boolean; onInvite: () => void }) {
  const demoTeam = [{ user_id: "demo-1", display_name: "Arun Manager", role: "super_admin", active: true, created_at: new Date().toISOString() }, { user_id: "demo-2", display_name: "Kavitha R", role: "cashier", active: true, created_at: new Date().toISOString() }, { user_id: "demo-3", display_name: "Saravanan M", role: "inventory_manager", active: true, created_at: new Date().toISOString() }, { user_id: "demo-4", display_name: "Nivetha P", role: "accountant", active: true, created_at: new Date().toISOString() }];
  const team = live ? records : demoTeam;
  const permissionText: Record<string, string> = { super_admin: "Full access", admin: "Store administration", cashier: "Sales & returns", inventory_manager: "Stock & purchases", accountant: "Reports & accounts", staff: "Basic store access" };
  return <div className="content-view"><ViewHeader eyebrow={`ACCESS CONTROL · ${live ? "LIVE" : "DEMO"}`} title="Staff & roles" description="Secure email invitations and database-enforced role permissions" actions={<><button className="outline-button"><ShieldCheck size={17} /> Manage roles</button><button className="primary-button" onClick={onInvite}><Plus size={17} /> Invite staff</button></>} /><div className="mini-stats"><article><Users size={20} /><span>Active staff<strong>{live ? team.filter((person) => person.active).length : "12 users"}</strong></span><Badge tone="green">{live ? "Store members" : "Demo"}</Badge></article><article><Gauge size={20} /><span>Super Admins<strong>{team.filter((person) => person.role === "super_admin").length}</strong></span><Badge tone="blue">Protected</Badge></article><article><WalletCards size={20} /><span>Cashiers<strong>{team.filter((person) => person.role === "cashier").length}</strong></span><Badge tone="neutral">Billing</Badge></article><article><ShieldCheck size={20} /><span>Security status<strong>RLS protected</strong></span><Badge tone="green">Active</Badge></article></div><div className="staff-grid">{team.map((person, index) => { const name = person.display_name || "Nila Staff"; return <article className="staff-card" key={person.user_id}><div className={`staff-avatar avatar-${index % 4 + 1}`}>{initials(name)}</div><div><strong>{name}</strong><span>{roleLabel(person.role)}</span></div><Badge tone={person.active ? "green" : "neutral"}>{person.active ? "Active" : "Disabled"}</Badge><div className="staff-permission"><ShieldCheck size={16} /><span>{permissionText[person.role] || "Assigned permissions"}</span></div><div className="staff-foot"><span>Added · {new Date(person.created_at).toLocaleDateString("en-IN")}</span><button className="icon-button"><MoreHorizontal size={17} /></button></div></article>; })}{live && !team.length && <div className="directory-empty"><Users size={26} /><strong>No staff members yet</strong><span>Invite the first cashier or inventory manager.</span></div>}</div><section className="panel permissions-panel"><div className="panel-head"><div><h2>Role permissions</h2><span>Enforced by Supabase Row Level Security</span></div><button>Configure <ChevronRight size={15} /></button></div><div className="permission-row permission-head"><span>Role</span><span>Billing</span><span>Purchases</span><span>Inventory</span><span>Reports</span><span>Settings</span></div>{[["Super Admin", 1, 1, 1, 1, 1], ["Admin", 1, 1, 1, 1, 1], ["Cashier", 1, 0, 0, 0, 0], ["Inventory Manager", 0, 1, 1, 0, 0], ["Accountant", 0, 1, 0, 1, 0]].map((row) => <div className="permission-row" key={String(row[0])}><strong>{row[0]}</strong>{row.slice(1).map((allowed, index) => <span key={index} className={allowed ? "allowed" : "denied"}>{allowed ? <Check size={14} /> : <Minus size={14} />}</span>)}</div>)}</section></div>;
}

function SettingsView({ language, setLanguage, profile, onSave }: { language: Language; setLanguage: (value: Language) => void; profile: StoreProfile; onSave: (data: FormData) => Promise<void> }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void onSave(new FormData(event.currentTarget)); };
  return <div className="content-view settings-view"><ViewHeader eyebrow="STORE CONFIGURATION" title="Settings" description="Customize your Nila Supermarket workspace" /><div className="settings-layout"><aside>{[["Store profile", Store], ["Billing & tax", ReceiptIndianRupee], ["Invoice design", FileSpreadsheet], ["Payment methods", WalletCards], ["Language", Languages], ["Barcode & print", Barcode], ["Notifications", Bell], ["Data & backup", ShieldCheck]].map(([label, Icon], index) => { const ItemIcon = Icon as LucideIcon; return <button type="button" className={index === 0 ? "active" : ""} key={String(label)}><ItemIcon size={18} />{String(label)}<ChevronRight size={15} /></button>; })}</aside><form className="settings-card" key={`${profile.name}-${profile.invoice_prefix}`} onSubmit={submit}><div className="settings-head"><div><h2>Store profile</h2><p>Saved to Supabase and shown on invoices and reports.</p></div><button type="button" className="outline-button"><Printer size={16} /> Preview invoice</button></div><div className="profile-logo-row"><div className="large-brand-mark"><MoonStar size={28} /></div><div><strong>{profile.name} logo</strong><span>Brand identity for receipts and reports</span><button type="button">Change logo</button></div></div><div className="form-grid"><label><span>Business name</span><input name="name" defaultValue={profile.name} required /></label><label><span>GSTIN</span><input name="gstin" defaultValue={profile.gstin} /></label><label className="full"><span>Store address</span><input name="address" defaultValue={profile.address} placeholder="Street, city, Tamil Nadu, PIN" /></label><label><span>Phone</span><input name="phone" defaultValue={profile.phone} /></label><label><span>Email</span><input name="email" type="email" defaultValue={profile.email} /></label><label><span>Invoice prefix</span><input name="invoice_prefix" defaultValue={profile.invoice_prefix} maxLength={8} required /></label><label><span>Financial year</span><select defaultValue="2026"><option value="2026">2026–27</option></select></label></div><div className="language-setting"><div><span className="settings-icon"><Languages size={20} /></span><div><strong>Default interface language</strong><small>Staff can switch language anytime.</small></div></div><div className="segmented"><button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>English</button><button type="button" className={language === "ta" ? "active" : ""} onClick={() => setLanguage("ta")}>தமிழ்</button></div></div><div className="settings-save"><span><ShieldCheck size={16} /> Store changes are protected by role policies</span><button type="submit" className="primary-button"><Check size={17} /> Save changes</button></div></form></div></div>;
}
