import { Client, Databases } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    // Parse request body
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { amount, currency = "usd", customerEmail, customerName } = body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.json(
        {
          success: false,
          error: "Invalid amount",
        },
        400,
      );
    }

    if (!customerEmail || !customerName) {
      return res.json(
        {
          success: false,
          error: "Customer email and name are required",
        },
        400,
      );
    }

    // Import Stripe (dynamically to avoid issues)
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    log(`Creating payment intent for ${customerEmail}, amount: ${amount}`);

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customerEmail: customerEmail,
        customerName: customerName,
      },
    });

    log(`Payment Intent created successfully: ${paymentIntent.id}`);

    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    error(`Error creating payment intent: ${err.message}`);

    return res.json(
      {
        success: false,
        error: err.message || "Failed to create payment intent",
      },
      500,
    );
  }
};
