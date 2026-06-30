import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { insertProductSchema, insertCategorySchema, insertOrderSchema, insertReviewSchema, insertSpecialOfferSchema, insertPaymentMethodSchema } from "@shared/schema";
import { sendOrderEmail } from "./lib/email";

// Simple session setup for Admin
const SessionStore = MemoryStore(session);
const adminTokens = new Map<string, { id: number; username: string }>();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Load persisted tokens from DB into memory on startup
  try {
    const admins = await storage.getAllAdmins();
    for (const admin of admins) {
      if (admin.token) adminTokens.set(admin.token, { id: admin.id, username: admin.username });
    }
  } catch (e) {
    console.warn("[auth] Could not load tokens from DB on startup:", e);
  }

  // Session Middleware
  app.set("trust proxy", 1);
  app.use(session({
    store: new SessionStore({ checkPeriod: 86400000 }),
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    name: 'rulvelt.sid',
    cookie: { 
      maxAge: 86400000,
      secure: "auto",
      httpOnly: true,
      sameSite: 'none',
      path: '/'
    }
  }));

  const getBearerAdmin = (req: any) => {
    const header = req.headers.authorization;
    if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {
      return null;
    }
    const token = header.slice("Bearer ".length);
    return adminTokens.get(token) || null;
  };

  // Helper to check if admin is authenticated
  const requireAuth = (req: any, res: any, next: any) => {
    const tokenAdmin = getBearerAdmin(req);
    if (req.session.adminId || tokenAdmin) {
      if (tokenAdmin && !req.session.adminId) {
        req.session.adminId = tokenAdmin.id;
        req.session.username = tokenAdmin.username;
      }
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  // --- HEALTH MONITORING ---
  app.get("/api/health", async (_req, res) => {
    try {
      await storage.getCategories(); // lightweight DB ping
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        database: "connected",
      });
    } catch {
      res.status(503).json({
        status: "error",
        timestamp: new Date().toISOString(),
        database: "unreachable",
      });
    }
  });

  // Log server health every 5 minutes for self-monitoring
  setInterval(async () => {
    try {
      await storage.getCategories();
      console.log(`[health] ✅ OK — uptime ${Math.floor(process.uptime())}s`);
    } catch (err) {
      console.error(`[health] ❌ DB unreachable:`, err);
    }
  }, 5 * 60 * 1000);

  // --- PUBLIC ROUTES ---

  // Products
  app.get(api.products.list.path, async (req, res) => {
    const filter = {
      category: req.query.category as string,
      search: req.query.search as string,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    };
    const products = await storage.getProducts(filter);
    res.json(products);
  });

  app.get("/api/products/count", async (req, res) => {
    const filter = {
      category: req.query.category as string,
      search: req.query.search as string,
    };
    const total = await storage.getProductsCount(filter);
    res.json({ total });
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProductBySlug(req.params.slug);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  // Categories
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get(api.categories.get.path, async (req, res) => {
    const category = await storage.getCategoryBySlug(req.params.slug);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  });

  // Orders
  // NOTE: verify-purchase MUST come before the :orderNumber wildcard route
  app.get("/api/orders/verify-purchase", async (req, res) => {
    try {
      const { orderNumber, productId } = req.query;
      if (!orderNumber || typeof orderNumber !== "string") return res.status(400).json({ message: "orderNumber is required" });
      const pid = parseInt(productId as string);
      if (isNaN(pid)) return res.status(400).json({ message: "productId is required" });
      const canRate = await storage.verifyPurchase(orderNumber, pid);
      res.json({ canRate });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      console.log("Creating order with data:", JSON.stringify(req.body, null, 2));
      const data = api.orders.create.input.parse(req.body);
      const orderData = {
        ...data.order,
        subtotal: data.order.subtotal.toString(),
        totalAmount: data.order.totalAmount.toString(),
        deliveryFee: (data.order.deliveryFee || "0").toString(),
        preferredDeliveryDate: (data.order as any).preferredDeliveryDate,
        preferredDeliveryTime: (data.order as any).preferredDeliveryTime,
      };
      const order = await storage.createOrder(orderData as any, data.items as any);
      
      console.log("Order created successfully, triggering email for order:", order.orderNumber);
      // Send confirmation email to customer and admin
      sendOrderEmail(order).catch(err => console.error("Failed to send order email:", err));

      res.status(201).json({ orderNumber: order.orderNumber, message: "Order placed successfully" });
    } catch (err) {
      console.error("Order creation error:", err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: err instanceof Error ? err.message : "Internal Server Error" });
      }
    }
  });

  app.get(api.orders.get.path, async (req, res) => {
    const order = await storage.getOrderByNumber(req.params.orderNumber);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  // Reviews
  app.get(api.reviews.list.path, async (req, res) => {
    const reviews = await storage.getReviews();
    res.json(reviews);
  });

  app.post(api.reviews.create.path, async (req, res) => {
    try {
      const data = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(data);
      res.status(201).json(review);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.get(api.specialOffers.list.path, async (req, res) => {
    const offers = await storage.getSpecialOffers({ activeOnly: true });
    res.json(offers);
  });

  app.get(api.paymentMethods.list.path, async (req, res) => {
    const methods = await storage.getPaymentMethods({ activeOnly: true });
    res.json(methods);
  });

  app.get(api.settings.list.path, async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  // Product Ratings (anonymous, no auth required)
  app.get("/api/products/:id/ratings", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) return res.status(400).json({ message: "Invalid product ID" });
      const browserKey = req.query.browserKey as string | undefined;
      const summary = await storage.getProductRating(productId, browserKey);
      res.json(summary);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/products/:id/ratings", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) return res.status(400).json({ message: "Invalid product ID" });
      const { stars, browserKey, orderNumber } = req.body;
      if (!stars || stars < 1 || stars > 5) return res.status(400).json({ message: "Stars must be 1-5" });
      if (!browserKey || typeof browserKey !== "string") return res.status(400).json({ message: "browserKey is required" });
      if (!orderNumber || typeof orderNumber !== "string") return res.status(400).json({ message: "orderNumber is required" });
      const summary = await storage.submitProductRating(productId, parseInt(stars), browserKey, orderNumber);
      res.json(summary);
    } catch (err: any) {
      if (err?.message === "You can only rate products you have purchased.") {
        return res.status(403).json({ message: err.message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // --- ADMIN ROUTES ---

  // Auth
  app.post(api.auth.login.path, async (req, res) => {
    const { username, password } = req.body;
    const user = await storage.getAdminUser(username);
    
    const passwordMatch = user ? await bcrypt.compare(password, user.password) : false;
    if (user && passwordMatch) {
      const token = crypto.randomBytes(32).toString("hex");
      adminTokens.set(token, { id: user.id, username: user.username });
      // Persist token to DB so it survives server restarts
      await storage.updateAdminUser(user.id, { token });
      (req.session as any).adminId = user.id;
      (req.session as any).username = user.username;
      res.json({ username: user.username, id: user.id, token, message: "Logged in" });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  app.post(api.auth.logout.path, async (req, res) => {
    const header = req.headers.authorization;
    if (header && typeof header === "string" && header.startsWith("Bearer ")) {
      const token = header.slice("Bearer ".length);
      const admin = adminTokens.get(token);
      adminTokens.delete(token);
      if (admin) await storage.updateAdminUser(admin.id, { token: null }).catch(() => {});
    }
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    const tokenAdmin = getBearerAdmin(req);
    if (tokenAdmin) {
      res.json({ username: tokenAdmin.username, id: tokenAdmin.id });
    } else if ((req.session as any).adminId) {
      res.json({ username: (req.session as any).username, id: (req.session as any).adminId });
    } else {
      res.status(401).json({ message: "Not logged in" });
    }
  });

  // Dashboard
  app.get(api.admin.dashboard.path, requireAuth, async (req, res) => {
    const filter = {
      date: req.query.date as string,
      month: req.query.month as string,
    };
    const stats = await storage.getDashboardStats(filter);
    res.json(stats);
  });

  app.get(api.admin.analytics.path, requireAuth, async (req, res) => {
    const data = await storage.getAnalytics();
    res.json(data);
  });

  // Admin Products
  app.get(api.admin.products.list.path, requireAuth, async (req, res) => {
    const products = await storage.getProducts(); // Admin sees all
    res.json(products);
  });

  app.post(api.admin.products.create.path, requireAuth, async (req, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(data);
      res.status(201).json(product);
    } catch (err) {
      console.error("Product creation error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })) 
        });
      }
      res.status(400).json({ message: "Invalid data", error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.put(api.admin.products.update.path, requireAuth, async (req, res) => {
    try {
      const data = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(Number(req.params.id), data);
      res.json(product);
    } catch (err) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete(api.admin.products.delete.path, requireAuth, async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    res.status(204).end();
  });

  app.get(api.admin.specialOffers.list.path, requireAuth, async (req, res) => {
    const offers = await storage.getSpecialOffers();
    res.json(offers);
  });

  app.post(api.admin.specialOffers.create.path, requireAuth, async (req, res) => {
    try {
      const data = insertSpecialOfferSchema.parse(req.body);
      const offer = await storage.createSpecialOffer(data);
      res.status(201).json(offer);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.put(api.admin.specialOffers.update.path, requireAuth, async (req, res) => {
    try {
      const data = insertSpecialOfferSchema.partial().parse(req.body);
      const offer = await storage.updateSpecialOffer(Number(req.params.id), data);
      res.json(offer);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete(api.admin.specialOffers.delete.path, requireAuth, async (req, res) => {
    await storage.deleteSpecialOffer(Number(req.params.id));
    res.status(204).end();
  });

  // Payment Methods (admin CRUD)
  app.get(api.admin.paymentMethods.list.path, requireAuth, async (req, res) => {
    const methods = await storage.getPaymentMethods();
    res.json(methods);
  });

  app.post(api.admin.paymentMethods.create.path, requireAuth, async (req, res) => {
    try {
      const data = insertPaymentMethodSchema.parse(req.body);
      const method = await storage.createPaymentMethod(data);
      res.status(201).json(method);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.put(api.admin.paymentMethods.update.path, requireAuth, async (req, res) => {
    try {
      const data = insertPaymentMethodSchema.partial().parse(req.body);
      const method = await storage.updatePaymentMethod(Number(req.params.id), data);
      res.json(method);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete(api.admin.paymentMethods.delete.path, requireAuth, async (req, res) => {
    await storage.deletePaymentMethod(Number(req.params.id));
    res.status(204).end();
  });

  // Product Variants (public)
  app.get("/api/products/:id/variants", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) return res.status(400).json({ message: "Invalid product ID" });
      const variants = await storage.getProductVariants(productId);
      res.json(variants);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Product Variants (admin CRUD)
  app.get("/api/admin/products/:id/variants", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const variants = await storage.getProductVariants(productId);
      res.json(variants);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/admin/products/:id/variants", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) return res.status(400).json({ message: "Invalid product ID" });
      const body = req.body || {};
      const { colorName, colorHex, imageUrl, stock, price, displayOrder } = body;
      if (!colorName) return res.status(400).json({ message: "colorName is required" });
      const variant = await storage.createVariant({
        productId,
        colorName,
        colorHex: colorHex || "#888888",
        imageUrl: imageUrl || null,
        stock: stock !== undefined ? parseInt(stock) : 0,
        price: price !== undefined && price !== null && price !== "" ? price.toString() : null,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : 0,
      });
      res.status(201).json(variant);
    } catch (err) {
      console.error("Error creating variant:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put("/api/admin/products/:productId/variants/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid variant ID" });
      const { colorName, colorHex, imageUrl, stock, price, displayOrder } = req.body;
      const updates: any = {};
      if (colorName !== undefined) updates.colorName = colorName;
      if (colorHex !== undefined) updates.colorHex = colorHex;
      if (imageUrl !== undefined) updates.imageUrl = imageUrl;
      if (stock !== undefined) updates.stock = parseInt(stock);
      if (price !== undefined) updates.price = price !== null && price !== "" ? price.toString() : null;
      if (displayOrder !== undefined) updates.displayOrder = parseInt(displayOrder);
      const variant = await storage.updateVariant(id, updates);
      res.json(variant);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete("/api/admin/products/:productId/variants/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVariant(id);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Admin Categories
  app.post(api.admin.categories.create.path, requireAuth, async (req, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(data);
      res.status(201).json(category);
    } catch (err) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.put(api.admin.categories.update.path, requireAuth, async (req, res) => {
    try {
      const data = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(Number(req.params.id), data);
      res.json(category);
    } catch (err) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete(api.admin.categories.delete.path, requireAuth, async (req, res) => {
    await storage.deleteCategory(Number(req.params.id));
    res.status(204).end();
  });

  // Admin Orders
  app.get(api.admin.orders.list.path, requireAuth, async (req, res) => {
    const filter = {
      status: req.query.status as string,
      search: req.query.search as string,
    };
    const orders = await storage.getOrders(filter);
    res.json(orders);
  });

  app.get(api.admin.orders.get.path, requireAuth, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  app.patch("/api/admin/orders/:id/status", requireAuth, async (req, res) => {
    try {
      const order = await storage.updateOrderStatus(Number(req.params.id), req.body.status);
      
      // Notify customer about status update
      if (order) {
        sendOrderEmail(order, true).catch(err => console.error("Failed to send status update email:", err));
      }

      res.json(order);
    } catch (err) {
      console.error("Status update error:", err);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  app.patch("/api/admin/orders/:id/delivery", requireAuth, async (req, res) => {
    const { preferredDeliveryDate, preferredDeliveryTime, scheduledDate, scheduledTime } = req.body;
    const order = await storage.updateOrderDelivery(
      Number(req.params.id), 
      preferredDeliveryDate, 
      preferredDeliveryTime,
      scheduledDate,
      scheduledTime
    );
    res.json(order);
  });

  app.delete("/api/admin/orders/:id", requireAuth, async (req, res) => {
    await storage.deleteOrder(Number(req.params.id));
    res.status(204).end();
  });

  // Public: Get event by date (for checkout)
  app.get("/api/events/by-date/:date", async (req, res) => {
    try {
      const event = await storage.getEventByDate(req.params.date);
      if (!event) return res.status(404).json({ message: "No event" });
      res.json(event);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  // Admin: Events CRUD
  app.get("/api/admin/events", requireAuth, async (req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.post("/api/admin/events", requireAuth, async (req, res) => {
    try {
      const event = await storage.createEvent(req.body);
      res.status(201).json(event);
    } catch (err) {
      console.error("Failed to create event:", err);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put("/api/admin/events/:id", requireAuth, async (req, res) => {
    try {
      const event = await storage.updateEvent(Number(req.params.id), req.body);
      res.json(event);
    } catch (err) {
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/admin/events/:id", requireAuth, async (req, res) => {
    await storage.deleteEvent(Number(req.params.id));
    res.status(204).end();
  });

  app.put("/api/admin/events/:id/products", requireAuth, async (req, res) => {
    try {
      const { productId, eventPrice } = req.body;
      const result = await storage.upsertEventProduct(Number(req.params.id), productId, eventPrice);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Failed to set event product price" });
    }
  });

  app.delete("/api/admin/events/:id/products/:productId", requireAuth, async (req, res) => {
    await storage.deleteEventProduct(Number(req.params.id), Number(req.params.productId));
    res.status(204).end();
  });

  // Admin Settings
  app.get(api.admin.settings.list.path, requireAuth, async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  app.put(api.admin.settings.update.path, requireAuth, async (req, res) => {
    const setting = await storage.updateSetting(req.params.key, req.body.value);
    res.json(setting);
  });

  // SEED DATA — only runs in development or when no admin exists yet
  const setupAdmin = async () => {
    const admins = await storage.getAllAdmins();
    if (admins.length > 0) {
      // Admin already exists; skip seed entirely in all environments
      return;
    }

    // No admin at all — create a default one so the panel is accessible
    const username = "admin";
    const plainPassword = "changeme123";
    const hashedPassword = await bcrypt.hash(plainPassword, 12);
    await storage.createAdminUser({ username, password: hashedPassword });
    console.log(`[auth] Created default admin user '${username}'. Change this password immediately via the admin panel.`);
  };
  
  setupAdmin().catch(console.error);

  const setupDefaultSpecialOffers = async () => {
    const seedFlag = await storage.getSetting("default_special_offers_seeded");
    const existingOffers = await storage.getSpecialOffers();
    if (seedFlag?.value === "true" || existingOffers.length > 0) return;

    await storage.createSpecialOffer({
      label: "Today's Offers",
      title: "Get Special Offer",
      discountPercentage: "20",
      buttonText: "Order Now",
      imageUrl: null,
      theme: "ruby",
      linkType: "sale",
      linkValue: null,
      isActive: true,
      displayOrder: 1,
    });
    await storage.createSpecialOffer({
      label: "Mother's Day Special",
      title: "Honor Mom with Flowers",
      discountPercentage: "15",
      buttonText: "Gift Her Now",
      imageUrl: null,
      theme: "blush",
      linkType: "sale",
      linkValue: null,
      isActive: true,
      displayOrder: 2,
    });
    await storage.createSpecialOffer({
      label: "Valentine's Day",
      title: "Share Your Love",
      discountPercentage: "25",
      buttonText: "Send Love",
      imageUrl: null,
      theme: "rose",
      linkType: "sale",
      linkValue: null,
      isActive: true,
      displayOrder: 3,
    });
    await storage.createSpecialOffer({
      label: "Anniversary Sale",
      title: "Celebrate Together",
      discountPercentage: "10",
      buttonText: "Shop Now",
      imageUrl: null,
      theme: "amber",
      linkType: "sale",
      linkValue: null,
      isActive: true,
      displayOrder: 4,
    });
    await storage.updateSetting("default_special_offers_seeded", "true");
  };

  setupDefaultSpecialOffers().catch(console.error);

  // Check if categories exist
  const categories = await storage.getCategories();
  if (categories.length === 0) {
    const roses = await storage.createCategory({ name: "Roses", slug: "roses", displayOrder: 1 });
    const tulips = await storage.createCategory({ name: "Tulips", slug: "tulips", displayOrder: 2 });
    const bouquets = await storage.createCategory({ name: "Bouquets", slug: "bouquets", displayOrder: 3 });
    
    // Seed products
    await storage.createProduct({
      name: "Eternal Red Rose Box",
      slug: "eternal-red-rose-box",
      categoryId: roses.id,
      price: "1500.00",
      stock: 50,
      description: "A luxurious box of premium red roses.",
      images: ["https://images.unsplash.com/photo-1596627689124-76295b97f9e8?q=80&w=600&auto=format&fit=crop"],
      badges: ["Best Seller"],
      isActive: true,
      sku: "ROSE-001"
    });
    
    await storage.createProduct({
      name: "Pink Tulip Bundle",
      slug: "pink-tulip-bundle",
      categoryId: tulips.id,
      price: "1200.00",
      stock: 30,
      description: "Fresh pink tulips for a lovely day.",
      images: ["https://images.unsplash.com/photo-1520763185298-1b434c919102?q=80&w=600&auto=format&fit=crop"],
      badges: ["New"],
      isActive: true,
      sku: "TULIP-001"
    });

    await storage.createProduct({
      name: "Luxury Mixed Bouquet",
      slug: "luxury-mixed-bouquet",
      categoryId: bouquets.id,
      price: "2500.00",
      stock: 15,
      description: "An elegant mix of seasonal luxury flowers.",
      images: ["https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=600&auto=format&fit=crop"],
      badges: ["Most Favorite"],
      isActive: true,
      sku: "MIX-001"
    });
  }

  // --- CUSTOMER (CRM) ROUTES ---

  // Admin: list customers with optional search
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const list = await storage.getCustomers(search ? { search } : undefined);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin: one-time backfill — aggregate all existing orders into customers table
  app.post("/api/customers/backfill", requireAuth, async (req, res) => {
    try {
      const result = await storage.backfillCustomers();
      res.json({ message: "Backfill complete", ...result });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin: export customers as CSV (all or selected by comma-separated ids param)
  app.get("/api/customers/export", requireAuth, async (req, res) => {
    try {
      const all = await storage.getCustomers();
      const idsParam = req.query.ids as string | undefined;
      const rows = idsParam
        ? all.filter(c => idsParam.split(",").includes(String(c.id)))
        : all;

      const escape = (v: string | null | undefined) => {
        if (v == null) return "";
        const s = String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"` : s;
      };

      const header = "Name,Email,Phone,Total Orders,Total Spent,Last Order Date\n";
      const body = rows.map(c => [
        escape(c.name),
        escape(c.email),
        escape(c.phone),
        c.totalOrders,
        Number(c.totalSpent).toFixed(2),
        c.lastOrderDate ? new Date(c.lastOrderDate).toISOString().slice(0, 10) : "",
      ].join(",")).join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="customers-${new Date().toISOString().slice(0,10)}.csv"`);
      res.send(header + body);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- PAYMONGO ROUTES ---
  // See server/lib/paymongo.ts for environment variable docs.

  // Public: check if PayMongo is configured (keys present)
  app.get("/api/paymongo/config", async (_req, res) => {
    const { isPayMongoConfigured, getPublicKey } = await import("./lib/paymongo");
    res.json({
      enabled: isPayMongoConfigured(),
      publicKey: getPublicKey(),
    });
  });

  // Public: create a PayMongo checkout session for an existing order
  app.post("/api/paymongo/checkout/:orderNumber", async (req, res) => {
    try {
      const { createCheckoutSession, isPayMongoConfigured } = await import("./lib/paymongo");
      if (!isPayMongoConfigured()) {
        return res.status(503).json({ message: "PayMongo is not configured on this deployment." });
      }
      const order = await storage.getOrderByNumber(req.params.orderNumber);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.status === "paid") return res.status(400).json({ message: "Order is already paid." });

      const baseUrl = (req.body.baseUrl as string) || `${req.protocol}://${req.get("host")}`;

      // Build line items from order items
      const lineItems = order.items.map((item) => ({
        name: item.productName + (item.variantColorName ? ` (${item.variantColorName})` : ""),
        quantity: item.quantity,
        amountPHP: Number(item.productPrice),
      }));

      // Fallback: single line item for the total if no items found
      const finalLineItems = lineItems.length > 0 ? lineItems : [{
        name: `Order ${order.orderNumber}`,
        quantity: 1,
        amountPHP: Number(order.totalAmount),
      }];

      const session = await createCheckoutSession({
        orderNumber: order.orderNumber,
        lineItems: finalLineItems,
        successUrl: `${baseUrl}/payment/success?order=${order.orderNumber}`,
        cancelUrl: `${baseUrl}/payment/failed?order=${order.orderNumber}`,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
      });

      // Store session ID on the order
      await storage.updateOrderPaymongo(order.orderNumber, session.sessionId);

      res.json({ checkoutUrl: session.checkoutUrl, sessionId: session.sessionId });
    } catch (err: any) {
      console.error("[paymongo] checkout error:", err);
      res.status(502).json({ message: err.message || "PayMongo API error. Please try again." });
    }
  });

  // Public: retry payment — creates a fresh checkout session for an existing pending order
  app.post("/api/paymongo/retry/:orderNumber", async (req, res) => {
    try {
      const { createCheckoutSession, isPayMongoConfigured } = await import("./lib/paymongo");
      if (!isPayMongoConfigured()) {
        return res.status(503).json({ message: "PayMongo is not configured on this deployment." });
      }
      const order = await storage.getOrderByNumber(req.params.orderNumber);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.status === "paid") return res.status(400).json({ message: "Order is already paid." });

      const baseUrl = (req.body.baseUrl as string) || `${req.protocol}://${req.get("host")}`;

      const lineItems = order.items.map((item) => ({
        name: item.productName + (item.variantColorName ? ` (${item.variantColorName})` : ""),
        quantity: item.quantity,
        amountPHP: Number(item.productPrice),
      }));

      const finalLineItems = lineItems.length > 0 ? lineItems : [{
        name: `Order ${order.orderNumber}`,
        quantity: 1,
        amountPHP: Number(order.totalAmount),
      }];

      const session = await createCheckoutSession({
        orderNumber: order.orderNumber,
        lineItems: finalLineItems,
        successUrl: `${baseUrl}/payment/success?order=${order.orderNumber}`,
        cancelUrl: `${baseUrl}/payment/failed?order=${order.orderNumber}`,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
      });

      await storage.updateOrderPaymongo(order.orderNumber, session.sessionId);
      res.json({ checkoutUrl: session.checkoutUrl, sessionId: session.sessionId });
    } catch (err: any) {
      console.error("[paymongo] retry error:", err);
      res.status(502).json({ message: err.message || "PayMongo API error. Please try again." });
    }
  });

  // Public: poll payment status for order (used by return page while waiting for webhook)
  app.get("/api/paymongo/session-status/:orderNumber", async (req, res) => {
    try {
      const order = await storage.getOrderByNumber(req.params.orderNumber);
      if (!order) return res.status(404).json({ message: "Order not found" });

      // If order is already marked paid in DB (webhook already fired), return immediately
      if (order.status === "paid") {
        return res.json({ status: "paid", orderNumber: order.orderNumber });
      }

      // If there's a session ID, check with PayMongo directly
      if ((order as any).paymongoSessionId) {
        try {
          const { getCheckoutSession, isPayMongoConfigured } = await import("./lib/paymongo");
          if (isPayMongoConfigured()) {
            const session = await getCheckoutSession((order as any).paymongoSessionId);
            if (session.paymentStatus === "succeeded") {
              await storage.updateOrderPaymongo(order.orderNumber, (order as any).paymongoSessionId, "paid");
              return res.json({ status: "paid", orderNumber: order.orderNumber });
            }
          }
        } catch (err) {
          console.error("[paymongo] session status check error:", err);
        }
      }

      res.json({ status: order.status, orderNumber: order.orderNumber });
    } catch (err: any) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Webhook: PayMongo notifies us when payment succeeds
  // Register webhook in PayMongo Dashboard → Developers → Webhooks
  // URL: https://<your-domain>/api/paymongo/webhook
  // Events: checkout_session.payment.paid
  app.post("/api/paymongo/webhook", async (req, res) => {
    try {
      const { verifyWebhookSignature } = await import("./lib/paymongo");
      const rawBody = typeof (req as any).rawBody === "string"
        ? (req as any).rawBody
        : (req as any).rawBody?.toString?.("utf8") || JSON.stringify(req.body);

      const signatureHeader = req.headers["paymongo-signature"] as string | undefined;
      if (!verifyWebhookSignature(rawBody, signatureHeader)) {
        console.warn("[paymongo] webhook signature verification failed");
        return res.status(401).json({ message: "Invalid webhook signature" });
      }

      const event = req.body;
      const eventType = event?.data?.attributes?.type;
      console.log(`[paymongo] webhook received: ${eventType}`);

      if (eventType === "checkout_session.payment.paid") {
        const sessionData = event.data.attributes.data;
        const sessionId: string = sessionData?.id;
        const orderNumber: string = sessionData?.attributes?.metadata?.order_number;

        if (!orderNumber) {
          console.warn("[paymongo] webhook missing order_number in metadata, sessionId:", sessionId);
          return res.json({ received: true });
        }

        const order = await storage.getOrderByNumber(orderNumber);
        if (!order) {
          console.warn("[paymongo] webhook: order not found:", orderNumber);
          return res.json({ received: true });
        }

        if (order.status !== "paid") {
          await storage.updateOrderPaymongo(orderNumber, sessionId, "paid");
          console.log(`[paymongo] ✅ Order ${orderNumber} marked as PAID via webhook`);
          sendOrderEmail({ ...order, status: "paid" } as any).catch((e) =>
            console.error("[paymongo] email error:", e)
          );
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[paymongo] webhook error:", err);
      res.status(500).json({ message: "Webhook processing error" });
    }
  });

  return httpServer;
}
