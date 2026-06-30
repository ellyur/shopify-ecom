import { db } from "./db";
import {
  products, categories, orders, orderItems, reviews, settings, specialOffers, adminUsers, productRatings, productVariants,
  eventPricing, eventPricingProducts, paymentMethods, customers,
  type Product, type InsertProduct,
  type Category, type InsertCategory,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type Review, type InsertReview,
  type Setting, type InsertSetting,
  type SpecialOffer, type InsertSpecialOffer,
  type AdminUser,
  type DashboardStats,
  type ProductRatingSummary,
  type ProductVariant, type InsertProductVariant,
  type EventPricing, type InsertEventPricing,
  type EventPricingProduct,
  type EventWithProducts,
  type PaymentMethod, type InsertPaymentMethod,
  type Customer,
} from "@shared/schema";
import { eq, ilike, desc, sql, and, gte, lte, avg, count } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(filter?: { category?: string, search?: string, limit?: number, offset?: number }): Promise<Product[]>;
  getProductsCount(filter?: { category?: string, search?: string }): Promise<number>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Orders
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrder(id: number): Promise<(Order & { items: OrderItem[] }) | undefined>;
  getOrderByNumber(orderNumber: string): Promise<(Order & { items: OrderItem[] }) | undefined>;
  getOrders(filter?: { status?: string, search?: string }): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  updateOrderDelivery(id: number, date: string, time: string, scheduledDate?: string, scheduledTime?: string): Promise<Order>;
  updateOrderPaymongo(orderNumber: string, sessionId: string, status?: string): Promise<Order>;
  deleteOrder(id: number): Promise<void>;

  // Reviews
  getReviews(): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Settings
  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: string): Promise<Setting>;

  // Special Offers
  getSpecialOffers(options?: { activeOnly?: boolean }): Promise<SpecialOffer[]>;
  getSpecialOffer(id: number): Promise<SpecialOffer | undefined>;
  createSpecialOffer(offer: InsertSpecialOffer): Promise<SpecialOffer>;
  updateSpecialOffer(id: number, updates: Partial<InsertSpecialOffer>): Promise<SpecialOffer>;
  deleteSpecialOffer(id: number): Promise<void>;

  // Admin
  getAdminUser(username: string): Promise<AdminUser | undefined>;
  getAdminByToken(token: string): Promise<AdminUser | undefined>;
  getAllAdmins(): Promise<AdminUser[]>;
  createAdminUser(user: Omit<AdminUser, "id" | "createdAt">): Promise<AdminUser>;
  updateAdminUser(id: number, updates: Partial<Omit<AdminUser, "id" | "createdAt">>): Promise<AdminUser>;

  // Dashboard
  getDashboardStats(filter?: { date?: string; month?: string }): Promise<DashboardStats>;
  getAnalytics(): Promise<{
    topProducts: { name: string; totalSold: number }[];
    revenueByMonth: { month: string; revenue: number }[];
    orderStatusBreakdown: { status: string; count: number }[];
    stockLevels: { name: string; stock: number }[];
    eventPopularity: { name: string; orders: number }[];
  }>;

  // Product Ratings
  getProductRating(productId: number, browserKey?: string): Promise<ProductRatingSummary>;
  submitProductRating(productId: number, stars: number, browserKey: string, orderNumber: string): Promise<ProductRatingSummary>;
  verifyPurchase(orderNumber: string, productId: number): Promise<boolean>;

  // Product Variants
  getProductVariants(productId: number): Promise<ProductVariant[]>;
  createVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  updateVariant(id: number, updates: Partial<InsertProductVariant>): Promise<ProductVariant>;
  deleteVariant(id: number): Promise<void>;

  // Event Pricing
  getEvents(): Promise<EventWithProducts[]>;
  getEventByDate(date: string): Promise<EventWithProducts | null>;
  createEvent(event: InsertEventPricing): Promise<EventPricing>;
  updateEvent(id: number, updates: Partial<InsertEventPricing>): Promise<EventPricing>;
  deleteEvent(id: number): Promise<void>;
  upsertEventProduct(eventId: number, productId: number, eventPrice: string): Promise<EventPricingProduct>;
  deleteEventProduct(eventId: number, productId: number): Promise<void>;

  // Payment Methods
  getPaymentMethods(options?: { activeOnly?: boolean }): Promise<PaymentMethod[]>;
  getPaymentMethod(id: number): Promise<PaymentMethod | undefined>;
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: number, updates: Partial<InsertPaymentMethod>): Promise<PaymentMethod>;
  deletePaymentMethod(id: number): Promise<void>;

  // Customers (CRM)
  getCustomers(filter?: { search?: string }): Promise<Customer[]>;
  upsertCustomer(email: string, name: string, phone: string | null | undefined, orderTotal: number): Promise<Customer>;
  backfillCustomers(): Promise<{ inserted: number; updated: number }>;
}

export class DatabaseStorage implements IStorage {
  // Products
  async getProducts(filter?: { category?: string, search?: string, limit?: number, offset?: number }): Promise<Product[]> {
    let conditions = [eq(products.isActive, true)];

    if (filter?.category) {
      const category = await this.getCategoryBySlug(filter.category);
      if (category) {
        conditions.push(eq(products.categoryId, category.id));
      } else if (!isNaN(Number(filter.category))) {
        conditions.push(eq(products.categoryId, Number(filter.category)));
      }
    }

    if (filter?.search) {
      conditions.push(ilike(products.name, `%${filter.search}%`));
    }

    let query = db.select().from(products).where(and(...conditions)).orderBy(desc(products.createdAt));

    if (filter?.limit) {
      query = query.limit(filter.limit) as typeof query;
    }

    if (filter?.offset) {
      query = query.offset(filter.offset) as typeof query;
    }

    return await query;
  }

  async getProductsCount(filter?: { category?: string, search?: string }): Promise<number> {
    let conditions = [eq(products.isActive, true)];

    if (filter?.category) {
      const category = await this.getCategoryBySlug(filter.category);
      if (category) {
        conditions.push(eq(products.categoryId, category.id));
      } else if (!isNaN(Number(filter.category))) {
        conditions.push(eq(products.categoryId, Number(filter.category)));
      }
    }

    if (filter?.search) {
      conditions.push(ilike(products.name, `%${filter.search}%`));
    }

    const [result] = await db.select({ total: count() }).from(products).where(and(...conditions));
    return result?.total ?? 0;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const namePart = insertProduct.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let categoryPart = '';
    if (insertProduct.categoryId) {
      const category = await this.getCategory(insertProduct.categoryId);
      if (category) {
        categoryPart = category.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-';
      }
    }

    const uniqueSuffix = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const slug = `${categoryPart}${namePart}-${uniqueSuffix}`;

    const [product] = await db.insert(products).values({ ...insertProduct, slug }).returning();
    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.displayOrder);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category> {
    const [category] = await db.update(categories).set(updates).where(eq(categories.id, id)).returning();
    return category;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Orders
  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    return await db.transaction(async (tx) => {
      // Generate order number if not present
      const orderNumber = `RUL-${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Ensure numeric fields are strings for Drizzle/PG numeric type
      const orderData = {
        ...insertOrder,
        orderNumber,
        subtotal: insertOrder.subtotal.toString(),
        totalAmount: insertOrder.totalAmount.toString(),
        deliveryFee: (insertOrder.deliveryFee || "0").toString(),
      };

      const [order] = await tx.insert(orders).values(orderData).returning();
      
      if (items.length > 0) {
        // Fetch product details with FOR UPDATE lock to prevent oversell race conditions
        const productIds = items.map(i => i.productId).filter((id): id is number => id !== undefined);
        const productsList = await tx.execute(
          sql`SELECT * FROM products WHERE id IN (${sql.join(productIds, sql`, `)}) FOR UPDATE`
        );
        const productMap = new Map((productsList.rows as any[]).map((p: any) => [p.id, p]));

        // Fetch variant details with FOR UPDATE lock if any items have variantId
        const variantIds = items.map(i => (i as any).variantId).filter((id): id is number => !!id);
        let variantMap = new Map<number, typeof productVariants.$inferSelect>();
        if (variantIds.length > 0) {
          const variantsList = await tx.execute(
            sql`SELECT * FROM product_variants WHERE id IN (${sql.join(variantIds, sql`, `)}) FOR UPDATE`
          );
          variantMap = new Map((variantsList.rows as any[]).map((v: any) => [v.id, v]));
        }

        // Validate stock availability before proceeding (prevents oversell)
        for (const item of items) {
          if ((item as any).variantId) {
            const variant = variantMap.get((item as any).variantId);
            if (!variant || Number(variant.stock) < item.quantity) {
              throw new Error(`Insufficient stock for variant: ${variant?.color_name || (item as any).variantColorName}`);
            }
          } else if (item.productId) {
            const product = productMap.get(item.productId);
            if (!product || Number(product.stock) < item.quantity) {
              throw new Error(`Insufficient stock for product: ${product?.name || "Unknown"}`);
            }
          }
        }

        const orderItemsWithOrderId = items.map(item => {
          const product = item.productId ? productMap.get(item.productId) : undefined;
          const variant = (item as any).variantId ? variantMap.get((item as any).variantId) : undefined;
          const price = variant?.price ?? (product ? product.price : "0");
          const name = product ? product.name : "Unknown Product";
          const productImage = variant?.imageUrl || (product && product.images && product.images.length > 0 ? product.images[0] : "");
          const subtotal = (Number(price) * item.quantity).toString();

          return {
            ...item,
            orderId: order.id,
            productName: name,
            productPrice: price.toString(),
            subtotal: subtotal,
            productImage: productImage,
            variantId: (item as any).variantId || null,
            variantColorName: (item as any).variantColorName || null,
          };
        });
        
        await tx.insert(orderItems).values(orderItemsWithOrderId);
  
        // Update stock (variant-level if variantId present, else product-level)
        for (const item of items) {
          if ((item as any).variantId) {
            await tx.update(productVariants)
              .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
              .where(eq(productVariants.id, (item as any).variantId));
          } else if (item.productId) {
            await tx.update(products)
              .set({ stock: sql`${products.stock} - ${item.quantity}` })
              .where(eq(products.id, item.productId));
          }
        }
      }

      // Upsert customer record (deduplicated by email, phone-only orders skipped)
      if (insertOrder.customerEmail) {
        try {
          await this.upsertCustomer(
            insertOrder.customerEmail,
            insertOrder.customerName,
            insertOrder.customerPhone,
            Number(insertOrder.totalAmount || 0),
          );
        } catch (err) {
          // Non-fatal: log but don't fail the order
          console.warn("[crm] customer upsert failed:", err);
        }
      }

      return order;
    });
  }

  async getOrder(id: number): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return { ...order, items };
  }

  async getOrderByNumber(orderNumber: string): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    if (!order) return undefined;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    return { ...order, items };
  }

  async getOrders(filter?: { status?: string, search?: string }): Promise<Order[]> {
    let query = db.select().from(orders);

    if (filter?.status && filter.status !== 'all') {
      query.where(eq(orders.status, filter.status));
    }

    if (filter?.search) {
      query.where(
        and(
          ilike(orders.orderNumber, `%${filter.search}%`),
        )
      );
    }

    return await query.orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [order] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return order;
  }

  async updateOrderPaymongo(orderNumber: string, sessionId: string, status?: string): Promise<Order> {
    const updates: Record<string, any> = { paymongoSessionId: sessionId, updatedAt: new Date() };
    if (status) updates.status = status;
    const [order] = await db.update(orders).set(updates).where(eq(orders.orderNumber, orderNumber)).returning();
    return order;
  }

  async updateOrderDelivery(id: number, date: string, time: string, scheduledDate?: string, scheduledTime?: string): Promise<Order> {
    const [order] = await db.update(orders)
      .set({ 
        preferredDeliveryDate: date, 
        preferredDeliveryTime: time,
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async deleteOrder(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(orderItems).where(eq(orderItems.orderId, id));
      await tx.delete(orders).where(eq(orders.id, id));
    });
  }

  // Reviews
  async getReviews(): Promise<Review[]> {
    return await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(insertReview).returning();
    return review;
  }

  // Settings
  async getSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async updateSetting(key: string, value: string): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() }
      })
      .returning();
    return setting;
  }

  async getSpecialOffers(options?: { activeOnly?: boolean }): Promise<SpecialOffer[]> {
    const query = db.select().from(specialOffers);
    if (options?.activeOnly) {
      return await query.where(eq(specialOffers.isActive, true)).orderBy(specialOffers.displayOrder);
    }
    return await query.orderBy(specialOffers.displayOrder);
  }

  async getSpecialOffer(id: number): Promise<SpecialOffer | undefined> {
    const [offer] = await db.select().from(specialOffers).where(eq(specialOffers.id, id));
    return offer;
  }

  async createSpecialOffer(offer: InsertSpecialOffer): Promise<SpecialOffer> {
    const [created] = await db.insert(specialOffers).values(offer).returning();
    return created;
  }

  async updateSpecialOffer(id: number, updates: Partial<InsertSpecialOffer>): Promise<SpecialOffer> {
    const [updated] = await db.update(specialOffers).set({ ...updates, updatedAt: new Date() }).where(eq(specialOffers.id, id)).returning();
    return updated;
  }

  async deleteSpecialOffer(id: number): Promise<void> {
    await db.delete(specialOffers).where(eq(specialOffers.id, id));
  }

  // Admin
  async getAdminUser(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user;
  }

  async getAdminByToken(token: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.token, token));
    return user;
  }

  async getAllAdmins(): Promise<AdminUser[]> {
    return db.select().from(adminUsers);
  }

  async createAdminUser(user: Omit<AdminUser, "id" | "createdAt">): Promise<AdminUser> {
    const [newUser] = await db.insert(adminUsers).values(user).returning();
    return newUser;
  }

  async updateAdminUser(id: number, updates: Partial<Omit<AdminUser, "id" | "createdAt">>): Promise<AdminUser> {
    const [user] = await db.update(adminUsers).set(updates).where(eq(adminUsers.id, id)).returning();
    return user;
  }

  // Dashboard
  async getDashboardStats(filter?: { date?: string; month?: string }): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    let endDate = new Date();

    if (filter?.date) {
      startDate = new Date(filter.date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(filter.date);
      endDate.setHours(23, 59, 59, 999);
    } else if (filter?.month) {
      if (filter.month === "all") {
        startDate = new Date(0); // Beginning of time
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
      } else if (filter.month === "this-month") {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      } else if (filter.month === "last-month") {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      } else if (!isNaN(Number(filter.month))) {
        const monthIndex = Number(filter.month);
        startDate = new Date(today.getFullYear(), monthIndex, 1);
        endDate = new Date(today.getFullYear(), monthIndex + 1, 0, 23, 59, 59, 999);
      }
    }

    const [ordersInPeriod] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)));

    const revenueResult = await db.execute(sql`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM orders 
      WHERE created_at >= ${startDate} AND created_at <= ${endDate} AND status != 'cancelled'
    `);
    const totalRevenue = Number(revenueResult.rows[0]?.total || 0);

    const [pending] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, 'pending'));

    const [productsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products);
    
    const lowStock = await db
      .select()
      .from(products)
      .where(lte(products.stock, 5))
      .limit(5);

    const recent = await db
      .select()
      .from(orders)
      .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
      .orderBy(desc(orders.createdAt))
      .limit(10);

    return {
      totalOrdersToday: Number(ordersInPeriod?.count || 0),
      totalRevenueMonth: totalRevenue,
      pendingOrders: Number(pending?.count || 0),
      totalProducts: Number(productsCount?.count || 0),
      lowStockProducts: lowStock,
      recentOrders: recent,
    };
  }

  async getAnalytics(): Promise<{
    topProducts: { name: string; totalSold: number }[];
    revenueByMonth: { month: string; revenue: number }[];
    orderStatusBreakdown: { status: string; count: number }[];
    stockLevels: { name: string; stock: number }[];
    eventPopularity: { name: string; orders: number }[];
  }> {
    // Top 10 most purchased products from order items
    const topProductsRaw = await db.execute(sql`
      SELECT p.name, COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 10
    `);
    const topProducts = (topProductsRaw.rows as any[]).map(r => ({
      name: r.name as string,
      totalSold: Number(r.total_sold),
    }));

    // Revenue by month for the last 12 months
    const revenueByMonthRaw = await db.execute(sql`
      SELECT
        TO_CHAR(created_at, 'Mon YY') as month,
        DATE_TRUNC('month', created_at) as month_date,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '12 months'
        AND status != 'cancelled'
      GROUP BY month, month_date
      ORDER BY month_date ASC
    `);
    const revenueByMonth = (revenueByMonthRaw.rows as any[]).map(r => ({
      month: r.month as string,
      revenue: Number(r.revenue),
    }));

    // Order status breakdown
    const statusBreakdownRaw = await db.execute(sql`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `);
    const orderStatusBreakdown = (statusBreakdownRaw.rows as any[]).map(r => ({
      status: r.status as string,
      count: Number(r.count),
    }));

    // Stock levels — all products ordered by stock asc (to highlight low stock)
    const stockRaw = await db
      .select({ name: products.name, stock: products.stock })
      .from(products)
      .orderBy(products.stock);
    const stockLevels = stockRaw.map(r => ({ name: r.name, stock: r.stock }));

    // Event popularity — events joined through their products to order items
    const eventRaw = await db.execute(sql`
      SELECT ep.name, COUNT(DISTINCT oi.order_id) as order_count
      FROM event_pricing ep
      LEFT JOIN event_pricing_products epp ON epp.event_id = ep.id
      LEFT JOIN order_items oi ON oi.product_id = epp.product_id
      GROUP BY ep.id, ep.name
      ORDER BY order_count DESC
      LIMIT 10
    `);
    const eventPopularity = (eventRaw.rows as any[]).map(r => ({
      name: r.name as string,
      orders: Number(r.order_count),
    }));

    return { topProducts, revenueByMonth, orderStatusBreakdown, stockLevels, eventPopularity };
  }

  // Product Ratings
  async getProductRating(productId: number, browserKey?: string): Promise<ProductRatingSummary> {
    const [agg] = await db
      .select({ avgRating: avg(productRatings.stars), count: count() })
      .from(productRatings)
      .where(eq(productRatings.productId, productId));

    let myRating: number | null = null;
    if (browserKey) {
      const [existing] = await db
        .select()
        .from(productRatings)
        .where(and(eq(productRatings.productId, productId), eq(productRatings.browserKey, browserKey)));
      myRating = existing ? existing.stars : null;
    }

    return {
      productId,
      avgRating: agg?.avgRating ? parseFloat(agg.avgRating as string) : 0,
      count: agg?.count ?? 0,
      myRating,
    };
  }

  async submitProductRating(productId: number, stars: number, browserKey: string, orderNumber: string): Promise<ProductRatingSummary> {
    const canRate = await this.verifyPurchase(orderNumber, productId);
    if (!canRate) {
      throw new Error("You can only rate products you have purchased.");
    }

    const [existing] = await db
      .select()
      .from(productRatings)
      .where(and(eq(productRatings.productId, productId), eq(productRatings.browserKey, browserKey)));

    if (existing) {
      await db
        .update(productRatings)
        .set({ stars })
        .where(eq(productRatings.id, existing.id));
    } else {
      await db.insert(productRatings).values({ productId, stars, browserKey });
    }

    return this.getProductRating(productId, browserKey);
  }

  async verifyPurchase(orderNumber: string, productId: number): Promise<boolean> {
    const [item] = await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(eq(orders.orderNumber, orderNumber), eq(orderItems.productId, productId)));
    return !!item;
  }

  // Product Variants
  async getProductVariants(productId: number): Promise<ProductVariant[]> {
    return await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(productVariants.displayOrder);
  }

  async createVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const [created] = await db.insert(productVariants).values(variant).returning();
    return created;
  }

  async updateVariant(id: number, updates: Partial<InsertProductVariant>): Promise<ProductVariant> {
    const [updated] = await db.update(productVariants).set(updates).where(eq(productVariants.id, id)).returning();
    return updated;
  }

  async deleteVariant(id: number): Promise<void> {
    await db.delete(productVariants).where(eq(productVariants.id, id));
  }

  // Event Pricing
  async getEvents(): Promise<EventWithProducts[]> {
    const events = await db.select().from(eventPricing).orderBy(desc(eventPricing.createdAt));
    const result: EventWithProducts[] = [];
    for (const event of events) {
      const prods = await db.select().from(eventPricingProducts).where(eq(eventPricingProducts.eventId, event.id));
      result.push({ ...event, products: prods });
    }
    return result;
  }

  async getEventByDate(date: string): Promise<EventWithProducts | null> {
    const [event] = await db
      .select()
      .from(eventPricing)
      .where(
        and(
          eq(eventPricing.isActive, true),
          lte(eventPricing.startDate, date),
          gte(eventPricing.endDate, date)
        )
      )
      .limit(1);
    if (!event) return null;
    const prods = await db
      .select()
      .from(eventPricingProducts)
      .where(eq(eventPricingProducts.eventId, event.id));
    return { ...event, products: prods };
  }

  async createEvent(event: InsertEventPricing): Promise<EventPricing> {
    const [created] = await db.insert(eventPricing).values(event).returning();
    return created;
  }

  async updateEvent(id: number, updates: Partial<InsertEventPricing>): Promise<EventPricing> {
    const [updated] = await db.update(eventPricing).set(updates).where(eq(eventPricing.id, id)).returning();
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(eventPricingProducts).where(eq(eventPricingProducts.eventId, id));
    await db.delete(eventPricing).where(eq(eventPricing.id, id));
  }

  async upsertEventProduct(eventId: number, productId: number, eventPrice: string): Promise<EventPricingProduct> {
    const [existing] = await db
      .select()
      .from(eventPricingProducts)
      .where(and(eq(eventPricingProducts.eventId, eventId), eq(eventPricingProducts.productId, productId)));
    if (existing) {
      const [updated] = await db
        .update(eventPricingProducts)
        .set({ eventPrice })
        .where(eq(eventPricingProducts.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(eventPricingProducts).values({ eventId, productId, eventPrice }).returning();
    return created;
  }

  async deleteEventProduct(eventId: number, productId: number): Promise<void> {
    await db.delete(eventPricingProducts).where(
      and(eq(eventPricingProducts.eventId, eventId), eq(eventPricingProducts.productId, productId))
    );
  }

  // Payment Methods
  async getPaymentMethods(options?: { activeOnly?: boolean }): Promise<PaymentMethod[]> {
    const query = db.select().from(paymentMethods);
    if (options?.activeOnly) {
      return await query.where(eq(paymentMethods.isActive, true)).orderBy(paymentMethods.displayOrder);
    }
    return await query.orderBy(paymentMethods.displayOrder);
  }

  async getPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    const [method] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    return method;
  }

  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    const [created] = await db.insert(paymentMethods).values(method).returning();
    return created;
  }

  async updatePaymentMethod(id: number, updates: Partial<InsertPaymentMethod>): Promise<PaymentMethod> {
    const [updated] = await db.update(paymentMethods).set({ ...updates, updatedAt: new Date() }).where(eq(paymentMethods.id, id)).returning();
    return updated;
  }

  async deletePaymentMethod(id: number): Promise<void> {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
  }

  // Customers (CRM)
  async getCustomers(filter?: { search?: string }): Promise<Customer[]> {
    let query = db.select().from(customers);
    if (filter?.search) {
      const term = `%${filter.search}%`;
      return await db.select().from(customers).where(
        sql`${customers.email} ILIKE ${term} OR ${customers.name} ILIKE ${term} OR ${customers.phone} ILIKE ${term}`
      ).orderBy(desc(customers.lastOrderDate));
    }
    return await query.orderBy(desc(customers.lastOrderDate));
  }

  async backfillCustomers(): Promise<{ inserted: number; updated: number }> {
    // Aggregate all orders by email in one SQL pass, then upsert into customers
    const result = await db.execute(sql`
      INSERT INTO customers (email, name, phone, total_orders, total_spent, last_order_date, created_at, updated_at)
      SELECT
        customer_email                         AS email,
        MAX(customer_name)                     AS name,
        MAX(customer_phone)                    AS phone,
        COUNT(*)::integer                      AS total_orders,
        SUM(CAST(total_amount AS numeric))     AS total_spent,
        MAX(created_at)                        AS last_order_date,
        MIN(created_at)                        AS created_at,
        NOW()                                  AS updated_at
      FROM orders
      WHERE customer_email IS NOT NULL AND customer_email <> ''
      GROUP BY customer_email
      ON CONFLICT (email) DO UPDATE SET
        name            = EXCLUDED.name,
        phone           = EXCLUDED.phone,
        total_orders    = EXCLUDED.total_orders,
        total_spent     = EXCLUDED.total_spent,
        last_order_date = EXCLUDED.last_order_date,
        updated_at      = NOW()
    `);
    // rowCount covers both inserts and updates; we report total affected rows
    const affected = (result as any).rowCount ?? 0;
    return { inserted: affected, updated: 0 };
  }

  async upsertCustomer(email: string, name: string, phone: string | null | undefined, orderTotal: number): Promise<Customer> {
    const [result] = await db.insert(customers)
      .values({
        email,
        name,
        phone: phone || null,
        totalOrders: 1,
        totalSpent: orderTotal.toString(),
        lastOrderDate: new Date(),
      })
      .onConflictDoUpdate({
        target: customers.email,
        set: {
          name,
          phone: phone || null,
          totalOrders: sql`${customers.totalOrders} + 1`,
          totalSpent: sql`${customers.totalSpent} + ${orderTotal.toString()}`,
          lastOrderDate: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
