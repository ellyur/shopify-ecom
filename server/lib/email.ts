import { Resend } from 'resend';

// Set to true to re-enable email sending via Resend
const EMAIL_ENABLED = false;

// Re-initialize Resend SDK to ensure environment variable is captured at runtime
export const getResendClient = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("CRITICAL: RESEND_API_KEY is not defined in environment variables.");
    return null;
  }
  return new Resend(key);
};

const ADMIN_EMAIL = 'lasopresaflowershop21@gmail.com';

const statusLabels: Record<string, string> = {
  pending: "Pending",
  downpayment: "Downpayment Received",
  paid: "Fully Paid",
  processing: "Processing",
  delivery: "In Delivery",
  completed: "Completed",
  cancelled: "Cancelled"
};

export const getOrderEmailTemplate = (order: any, isStatusUpdate = false) => {
  const status = statusLabels[order.status] || order.status;
  const title = isStatusUpdate ? `Order Status Updated: ${status}` : "New Order Received";
  const message = isStatusUpdate 
    ? `Your order ${order.orderNumber} status has been updated to: ${status}.`
    : `Thank you for your order ${order.orderNumber}! We have received it and will process it shortly.`;

  return `
    <div style="font-family: serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 40px; color: #1a202c;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #214822; margin-bottom: 10px;">Liceria Rose FlowerShop</h1>
        <div style="width: 50px; height: 1px; background: #A6845B; margin: 0 auto;"></div>
      </div>
      
      <h2 style="font-size: 24px; margin-bottom: 20px;">${title}</h2>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        Hello ${order.customerName},<br><br>
        ${message}
      </p>

      <div style="background: #f8fafc; padding: 20px; margin-bottom: 30px;">
        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 15px;">Order Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; color: #64748b;">Order Number:</td>
            <td style="padding: 5px 0; text-align: right; font-weight: bold;">${order.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748b;">Total Amount:</td>
            <td style="padding: 5px 0; text-align: right; font-weight: bold;">₱${Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748b;">Method:</td>
            <td style="padding: 5px 0; text-align: right; font-weight: bold; text-transform: capitalize;">${order.orderType}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center;">
        <a href="https://liceriarose.store/track?order=${order.orderNumber}" 
           style="display: inline-block; background: #214822; color: white; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px;">
          Track Your Order
        </a>
      </div>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; font-style: italic;">
        "Bringing luxury and elegance to every special moment"
      </div>
    </div>
  `;
};

export const sendOrderEmail = async (order: any, isStatusUpdate = false) => {
  if (!EMAIL_ENABLED) {
    console.log("Email sending is disabled. Skipping email for order:", order.orderNumber);
    return;
  }

  const resend = getResendClient();
  if (!resend) {
    console.error("Email client not initialized. Skipping send.");
    return;
  }

  try {
    console.log("Starting email send for order:", order.orderNumber);
    const html = getOrderEmailTemplate(order, isStatusUpdate);
    const subject = isStatusUpdate 
      ? `Order Update: ${order.orderNumber} - Liceria Rose`
      : `Order Confirmation: ${order.orderNumber} - Liceria Rose`;

    if (order.customerEmail) {
      console.log("Sending to customer:", order.customerEmail);
      const html = getOrderEmailTemplate(order, isStatusUpdate).replace(
        /https:\/\/liceria-rose\.replit\.app\/track/g,
        "https://liceriarose.store/track"
      );
      const customerResult = await resend.emails.send({
        from: 'Liceria Rose <orders@liceriarose.store>',
        to: [order.customerEmail],
        subject,
        html,
      });
      console.log("Customer result:", JSON.stringify(customerResult));
    }

    // Notify Admin on new order
    if (!isStatusUpdate) {
      console.log("Sending to admin:", ADMIN_EMAIL);
      const adminHtml = `
        <div style="font-family: serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 40px; color: #1a202c;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #214822; margin-bottom: 10px;">Liceria Rose - New Order Alert</h1>
            <div style="width: 50px; height: 1px; background: #A6845B; margin: 0 auto;"></div>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-left: 4px solid #214822; margin-bottom: 30px;">
            <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #214822;">Order Summary</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Order Number:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${order.orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Customer:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${order.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Contact:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${order.customerPhone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Email:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${order.customerEmail || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Type:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; text-transform: capitalize;">${order.orderType}</td>
              </tr>
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 12px 0; color: #1a202c; font-weight: bold;">Total Amount:</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #214822; font-size: 18px;">₱${Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center;">
            <a href="https://liceriarose.store/admin/orders" 
               style="display: inline-block; background: #214822; color: white; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; border-radius: 4px;">
              Manage Order in Admin Panel
            </a>
          </div>
        </div>
      `;

      const adminResult = await resend.emails.send({
        from: 'Liceria Rose System <system@liceriarose.store>',
        to: [ADMIN_EMAIL],
        subject: `New Order Received: ${order.orderNumber}`,
        html: adminHtml,
      });
      console.log("Admin result:", JSON.stringify(adminResult));
    }
  } catch (error) {
    console.error('Email send failed:', error);
  }
};
