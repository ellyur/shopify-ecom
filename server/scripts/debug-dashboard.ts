
  import { Resend } from 'resend';
  import dotenv from 'dotenv';
  dotenv.config();

  const resend = new Resend('re_5zeqU5Kb_9q7sGsHHbigNqLgeYRny2RNt');

  async function test() {
    console.log("Starting debug-dashboard test...");
    try {
      const { data, error } = await resend.emails.send({
        from: 'Liceria Rose <orders@liceriarose.store>',
        to: 'lasopresaflowershop21@gmail.com',
        subject: 'Liceria Rose - Dashboard Activity Test',
        html: '<p>This test is to force activity on the Resend dashboard for the new admin email.</p>'
      });
      
      if (error) {
        console.error("Resend API Error:", JSON.stringify(error, null, 2));
      } else {
        console.log("Resend Success Data:", JSON.stringify(data, null, 2));
      }
      process.exit(0);
    } catch (err) {
      console.error("Exception during send:", err);
      process.exit(1);
    }
  }

  test();
  