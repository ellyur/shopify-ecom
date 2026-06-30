import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Categories Table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products Table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  categoryId: integer("category_id"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  description: text("description"),
  images: text("images").array().default([]), // Array of image URLs
  badges: text("badges").array().default([]), // ['Best Seller', 'Most Favorite', 'New Arrival', 'Limited Edition', 'On Sale']
  sku: text("sku"),
  discountPercentage: numeric("discount_percentage", { precision: 5, scale: 2 }).default('0'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders Table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(), // RUL-XXXX
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  customerFbProfile: text("customer_fb_profile"),
  deliveryAddress: text("delivery_address").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code"),
  specialInstructions: text("special_instructions"),
  preferredDeliveryDate: text("preferred_delivery_date"),
  preferredDeliveryTime: text("preferred_delivery_time"),
  orderType: text("order_type").default('delivery'), // 'pickup' | 'delivery'
  scheduledDate: text("scheduled_date"),
  scheduledTime: text("scheduled_time"),
  paymentMethod: text("payment_method").notNull(), // 'cod' | 'gcash' | 'bank'
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).default('0'),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default('pending'), // pending, paid, processing, delivery, completed, cancelled
  paymongoSessionId: text("paymongo_session_id"), // PayMongo checkout session ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order Items Table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id"), // Nullable in case product is deleted, but we keep the record
  productName: text("product_name").notNull(),
  productPrice: numeric("product_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  productImage: text("product_image"),
  variantId: integer("variant_id"),
  variantColorName: text("variant_color_name"),
});

// Settings Table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").unique().notNull(),
  value: text("value"), // JSON string or simple text
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const specialOffers = pgTable("special_offers", {
  id: serial("id").primaryKey(),
  label: text("label").notNull().default("Today's Offers"),
  title: text("title").notNull(),
  discountPercentage: numeric("discount_percentage", { precision: 5, scale: 2 }).default("0"),
  buttonText: text("button_text").notNull().default("Order Now"),
  imageUrl: text("image_url"),
  theme: text("theme").notNull().default("ruby"),
  linkType: text("link_type").notNull().default("sale"),
  linkValue: text("link_value"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews Table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(), // 1-5
  reviewText: text("review_text").notNull(),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customers Table (deduplicated by email — upserted on every order)
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  totalOrders: integer("total_orders").notNull().default(0),
  totalSpent: numeric("total_spent", { precision: 12, scale: 2 }).notNull().default("0"),
  lastOrderDate: timestamp("last_order_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin Users Table
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(), // hashed
  token: text("token"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product Variants Table (color options per product)
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  colorName: text("color_name").notNull(),
  colorHex: text("color_hex").notNull().default('#888888'),
  imageUrl: text("image_url"),
  stock: integer("stock").notNull().default(0),
  price: numeric("price", { precision: 10, scale: 2 }),
  displayOrder: integer("display_order").default(0),
});

// Product Ratings Table (anonymous, browser-keyed)
export const productRatings = pgTable("product_ratings", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  stars: integer("stars").notNull(), // 1-5
  browserKey: text("browser_key").notNull(), // random UUID stored in localStorage
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment Methods Table
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  type: text("type").notNull().default("online"), // 'cod' | 'online'
  logoUrl: text("logo_url"),
  qrUrl: text("qr_url"),
  instructions: text("instructions"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event Pricing Table
export const eventPricing = pgTable("event_pricing", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(), // YYYY-MM-DD
  endDate: text("end_date").notNull(),     // YYYY-MM-DD
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event Pricing Per-Product Overrides
export const eventPricingProducts = pgTable("event_pricing_products", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  productId: integer("product_id").notNull(),
  eventPrice: numeric("event_price", { precision: 10, scale: 2 }).notNull(),
});

// RELATIONS
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// SCHEMAS
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  slug: z.string().optional(),
});
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, orderNumber: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true, updatedAt: true });
export const insertSpecialOfferSchema = createInsertSchema(specialOffers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({ id: true, createdAt: true });
export const insertProductRatingSchema = createInsertSchema(productRatings).omit({ id: true, createdAt: true });
export const insertProductVariantSchema = createInsertSchema(productVariants).omit({ id: true });
export const insertEventPricingSchema = createInsertSchema(eventPricing).omit({ id: true, createdAt: true });
export const insertEventPricingProductSchema = createInsertSchema(eventPricingProducts).omit({ id: true });
export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });

// TYPES
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type SpecialOffer = typeof specialOffers.$inferSelect;
export type InsertSpecialOffer = z.infer<typeof insertSpecialOfferSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type AdminUser = typeof adminUsers.$inferSelect;

export type ProductRating = typeof productRatings.$inferSelect;
export type InsertProductRating = z.infer<typeof insertProductRatingSchema>;

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;

export type EventPricing = typeof eventPricing.$inferSelect;
export type InsertEventPricing = z.infer<typeof insertEventPricingSchema>;
export type EventPricingProduct = typeof eventPricingProducts.$inferSelect;
export type InsertEventPricingProduct = z.infer<typeof insertEventPricingProductSchema>;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type EventWithProducts = EventPricing & {
  products: (EventPricingProduct & { productName?: string })[];
};

export type ProductRatingSummary = {
  productId: number;
  avgRating: number;
  count: number;
  myRating: number | null; // null means not yet voted
};

// API TYPES
export type ProductResponse = Product & { category?: Category };
export type OrderResponse = Order & { items?: OrderItem[] };
export type CartItem = {
  productId: number;
  quantity: number;
  product: Product;
  variantId?: number;
  variantColorName?: string;
  variantImageUrl?: string;
  cartKey: string;
};

// Dashboard Stats Type
export type DashboardStats = {
  totalOrdersToday: number;
  totalRevenueMonth: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockProducts: Product[];
  recentOrders: Order[];
};
