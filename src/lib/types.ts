import type {
  BreakupLine,
  OrderPaymentStatus,
  OrderPriceResult,
  OrderStatus,
  ProductType,
  QuotationStatus,
} from '@neon-adda/shared';

/** A sign as the API accepts it. Prices are always worked out on the server. */
export interface DesignInput {
  productId: string;
  config: TextConfig | LogoConfig;
  widthIn: number;
  heightIn: number;
  backboardCode: string;
  addonCodes: string[];
}

export interface Tube {
  colorName: string;
  glowHex: string;
  tubeHex: string;
}

export interface TextConfig {
  mode: 'TEXT';
  lines: (Tube & { text: string })[];
  fontFamily: string;
  backgroundCode?: string;
}

export interface LogoConfig extends Tube {
  mode: 'LOGO';
  uploadId: string;
}

/** Enough of a text design to draw it in CSS. */
export interface Lettering {
  fontFamily: string;
  lines: { text: string; glowHex: string; tubeHex?: string }[];
}

export function letteringOf(design: DesignInput): Lettering | null {
  return design.config.mode === 'TEXT'
    ? { fontFamily: design.config.fontFamily, lines: design.config.lines }
    : null;
}

export interface Category {
  slug: string;
  name: string;
  description: string | null;
  products: number;
}

export interface ReadymadeDesign {
  lines: (Tube & { text: string })[];
  fontFamily: string;
  backboardCode: string;
}

export interface ProductCard {
  slug: string;
  name: string;
  category: { slug: string; name: string };
  tags: string[];
  isFeatured: boolean;
  design: ReadymadeDesign | null;
  imageUrl: string | null;
  fromPricePaise: number | null;
}

export interface ProductDetail extends ProductCard {
  id: string;
  description: string | null;
  highlights: string[];
  sizes: { label: string; widthIn: number; heightIn: number }[];
  backboards: { code: string; name: string; material: string }[];
  leadTimeDays: number;
  related: ProductCard[];
}

export interface Serviceability {
  pincode: string;
  serviceable: boolean;
  place: { city: string; district: string; stateCode: string } | null;
  zone?: string;
  installationAvailable?: boolean;
  deliveryDays?: { min: number; max: number };
}

export interface Address {
  id: string;
  label: string | null;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  stateCode: string;
  pincode: string;
  gstin: string | null;
  businessName: string | null;
  isDefault: boolean;
}

export type AddressSnapshot = Omit<Address, 'id' | 'label' | 'isDefault'>;

export interface CheckoutPrice {
  price: OrderPriceResult;
  coupon: { code: string; applied: boolean; message: string | null } | null;
  zone: { name: string; installationAvailable: boolean } | null;
  minOrderValuePaise: number;
  lines: { description: string; quoteOnly: boolean }[];
}

export interface OrderSummary {
  orderNo: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  totalPaise: number;
  amountDuePaise: number;
  placedAt: string;
  signs: number;
  title: string;
  previewUrl: string | null;
  lettering: Lettering | null;
  awaitingProof: boolean;
}

export type ProofStatus = 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'SUPERSEDED';

export interface Proof {
  id: string;
  version: number;
  imageUrl: string | null;
  designerNote: string | null;
  status: ProofStatus;
  customerComment: string | null;
  sentAt: string;
  respondedAt: string | null;
}

export interface OrderDetail {
  orderNo: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentMode: 'FULL' | 'ADVANCE' | 'COD';
  placedAt: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  installationRequired: boolean;
  items: {
    id: string;
    description: string;
    widthIn: number;
    heightIn: number;
    qty: number;
    unitPricePaise: number;
    amountPaise: number;
    previewUrl: string | null;
    lettering: Lettering | null;
    proofStatus: ProofStatus;
    revisionsLeft: number;
    proofs: Proof[];
  }[];
  breakup: BreakupLine[];
  totals: {
    itemsPaise: number;
    installationPaise: number;
    deliveryPaise: number;
    discountPaise: number;
    taxablePaise: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    roundOffPaise: number;
    totalPaise: number;
    paidPaise: number;
    duePaise: number;
  };
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
  history: { status: OrderStatus; note: string | null; at: string }[];
  shipment: { courier: string | null; awbNo: string | null; trackingUrl: string | null } | null;
  installation: {
    status: string;
    scheduledStart: string | null;
    scheduledEnd: string | null;
    technician: string | null;
    completedAt: string | null;
    completionCode: string | null;
  } | null;
  invoices: { invoiceNo: string; issuedAt: string; url: string | null }[];
  review: { rating: number; comment: string | null; reply: string | null; at: string } | null;
  tickets: {
    id: string;
    type: string;
    description: string;
    status: string;
    resolution: string | null;
    at: string;
  }[];
  canCancel: boolean;
  canReview: boolean;
}

export type QuoteKind = 'LOGO' | 'LARGE' | 'BULK' | 'CUSTOM';

export interface Quote {
  id: string;
  quoteNo: string;
  version: number;
  status: QuotationStatus;
  requestedAt: string;
  request: {
    kind: QuoteKind;
    widthIn: number | null;
    heightIn: number | null;
    qty: number;
    pincode: string;
    installation: boolean;
    message: string | null;
  } | null;
  previewUrl: string | null;
  lettering: Lettering | null;
  logoUrl: string | null;
  items: {
    id: string;
    description: string;
    widthIn: number | null;
    heightIn: number | null;
    qty: number;
    amountPaise: number;
  }[];
  totals: {
    subtotalPaise: number;
    discountPaise: number;
    taxablePaise: number;
    gstPaise: number;
    totalPaise: number;
  } | null;
  validUntil: string | null;
  terms: string | null;
  sentAt: string | null;
  orderNo: string | null;
}

export interface SavedDesign {
  id: string;
  name: string;
  previewUrl: string | null;
  shareSlug: string | null;
  product: { slug: string; name: string; type: ProductType };
  design: DesignInput;
  createdAt: string;
}
