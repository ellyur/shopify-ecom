import { z } from 'zod';
import { 
  insertCategorySchema, 
  insertProductSchema, 
  insertOrderSchema, 
  insertReviewSchema, 
  insertSettingSchema,
  insertSpecialOfferSchema,
  insertPaymentMethodSchema,
  categories,
  products,
  orders,
  reviews,
  settings,
  specialOffers,
  paymentMethods,
  orderItems
} from './schema';

// Error Schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// API Contract
export const api = {
  // Public Routes
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,
      input: z.object({
        category: z.string().optional(), // category slug or id
        search: z.string().optional(),
        sort: z.string().optional(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:slug' as const, // using slug for SEO friendly URLs
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories' as const,
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/categories/:slug' as const,
      responses: {
        200: z.custom<typeof categories.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  orders: {
    create: {
      method: 'POST' as const,
      path: '/api/orders' as const,
      input: z.object({
        order: insertOrderSchema,
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number(),
          variantId: z.number().nullable().optional(),
          variantColorName: z.string().nullable().optional(),
        })),
      }),
      responses: {
        201: z.object({
          orderNumber: z.string(),
          message: z.string(),
        }),
        400: errorSchemas.validation,
      },
    },
    get: { // For tracking order status publicly if needed
      method: 'GET' as const,
      path: '/api/orders/:orderNumber' as const,
      responses: {
        200: z.custom<typeof orders.$inferSelect & { items: typeof orderItems.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
  },
  reviews: {
    list: {
      method: 'GET' as const,
      path: '/api/reviews' as const,
      responses: {
        200: z.array(z.custom<typeof reviews.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/reviews' as const,
      input: insertReviewSchema,
      responses: {
        201: z.custom<typeof reviews.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  specialOffers: {
    list: {
      method: 'GET' as const,
      path: '/api/special-offers' as const,
      responses: {
        200: z.array(z.custom<typeof specialOffers.$inferSelect>()),
      },
    },
  },
  settings: {
    list: {
      method: 'GET' as const,
      path: '/api/settings' as const,
      responses: {
        200: z.array(z.custom<typeof settings.$inferSelect>()),
      },
    },
  },
  paymentMethods: {
    list: {
      method: 'GET' as const,
      path: '/api/payment-methods' as const,
      responses: {
        200: z.array(z.custom<typeof paymentMethods.$inferSelect>()),
      },
    },
  },
  
  // Admin Routes (Protected)
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.object({ username: z.string(), id: z.number() }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  admin: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/admin/dashboard' as const,
      responses: {
        200: z.object({
          totalOrdersToday: z.number(),
          totalRevenueMonth: z.number(),
          pendingOrders: z.number(),
          totalProducts: z.number(),
          recentOrders: z.array(z.custom<typeof orders.$inferSelect>()),
          lowStockProducts: z.array(z.custom<typeof products.$inferSelect>()),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    analytics: {
      method: 'GET' as const,
      path: '/api/admin/analytics' as const,
      responses: {
        200: z.object({
          topProducts: z.array(z.object({ name: z.string(), totalSold: z.number() })),
          revenueByMonth: z.array(z.object({ month: z.string(), revenue: z.number() })),
          orderStatusBreakdown: z.array(z.object({ status: z.string(), count: z.number() })),
          stockLevels: z.array(z.object({ name: z.string(), stock: z.number() })),
          eventPopularity: z.array(z.object({ name: z.string(), orders: z.number() })),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    products: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/products' as const,
        responses: {
          200: z.array(z.custom<typeof products.$inferSelect>()),
          401: errorSchemas.unauthorized,
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/admin/products' as const,
        input: insertProductSchema,
        responses: {
          201: z.custom<typeof products.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/admin/products/:id' as const,
        input: insertProductSchema.partial(),
        responses: {
          200: z.custom<typeof products.$inferSelect>(),
          400: errorSchemas.validation,
          404: errorSchemas.notFound,
          401: errorSchemas.unauthorized,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/admin/products/:id' as const,
        responses: {
          204: z.void(),
          404: errorSchemas.notFound,
          401: errorSchemas.unauthorized,
        },
      },
    },
    specialOffers: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/special-offers' as const,
        responses: {
          200: z.array(z.custom<typeof specialOffers.$inferSelect>()),
          401: errorSchemas.unauthorized,
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/admin/special-offers' as const,
        input: insertSpecialOfferSchema,
        responses: {
          201: z.custom<typeof specialOffers.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/admin/special-offers/:id' as const,
        input: insertSpecialOfferSchema.partial(),
        responses: {
          200: z.custom<typeof specialOffers.$inferSelect>(),
          400: errorSchemas.validation,
          404: errorSchemas.notFound,
          401: errorSchemas.unauthorized,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/admin/special-offers/:id' as const,
        responses: {
          204: z.void(),
          404: errorSchemas.notFound,
          401: errorSchemas.unauthorized,
        },
      },
    },
    categories: {
      create: {
        method: 'POST' as const,
        path: '/api/admin/categories' as const,
        input: insertCategorySchema,
        responses: {
          201: z.custom<typeof categories.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/admin/categories/:id' as const,
        input: insertCategorySchema.partial(),
        responses: {
          200: z.custom<typeof categories.$inferSelect>(),
          400: errorSchemas.validation,
          404: errorSchemas.notFound,
          401: errorSchemas.unauthorized,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/admin/categories/:id' as const,
        responses: {
          204: z.void(),
          404: errorSchemas.notFound,
          401: errorSchemas.unauthorized,
        },
      },
    },
    orders: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/orders' as const,
        input: z.object({
          status: z.string().optional(),
          search: z.string().optional(),
        }).optional(),
        responses: {
          200: z.array(z.custom<typeof orders.$inferSelect>()),
          401: errorSchemas.unauthorized,
        },
      },
      updateStatus: {
        method: 'PATCH' as const,
        path: '/api/admin/orders/:id/status' as const,
        input: z.object({ status: z.string() }),
        responses: {
          200: z.custom<typeof orders.$inferSelect>(),
          404: errorSchemas.notFound,
          401: errorSchemas.unauthorized,
        },
      },
      get: {
        method: 'GET' as const,
        path: '/api/admin/orders/:id' as const,
        responses: {
          200: z.custom<typeof orders.$inferSelect & { items: typeof orderItems.$inferSelect[] }>(),
          404: errorSchemas.notFound,
          401: errorSchemas.unauthorized,
        },
      },
    },
    settings: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/settings' as const,
        responses: {
          200: z.array(z.custom<typeof settings.$inferSelect>()),
          401: errorSchemas.unauthorized,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/admin/settings/:key' as const,
        input: z.object({ value: z.string() }),
        responses: {
          200: z.custom<typeof settings.$inferSelect>(),
          404: errorSchemas.notFound,
          401: errorSchemas.unauthorized,
        },
      },
    },
    paymentMethods: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/payment-methods' as const,
        responses: {
          200: z.array(z.custom<typeof paymentMethods.$inferSelect>()),
          401: errorSchemas.unauthorized,
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/admin/payment-methods' as const,
        input: insertPaymentMethodSchema,
        responses: {
          201: z.custom<typeof paymentMethods.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/admin/payment-methods/:id' as const,
        input: insertPaymentMethodSchema.partial(),
        responses: {
          200: z.custom<typeof paymentMethods.$inferSelect>(),
          400: errorSchemas.validation,
          404: errorSchemas.notFound,
          401: errorSchemas.unauthorized,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/admin/payment-methods/:id' as const,
        responses: {
          204: z.void(),
          404: errorSchemas.notFound,
          401: errorSchemas.unauthorized,
        },
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
