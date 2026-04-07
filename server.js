import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());

// ⚠️ webhook precisa raw
app.use("/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔥 SUPABASE
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔥 ROTA IA (mantém seu sistema funcionando)
app.post("/ia", async (req, res) => {
  const { texto } = req.body;

  res.json({
    resposta: `Resposta simulada da IA para: ${texto}`,
  });
});

// 🔥 STRIPE CHECKOUT
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { email } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "NeuroMapa360 Premium",
            },
            unit_amount: 1990,
          },
          quantity: 1,
        },
      ],
      success_url: "https://neuro360-syc6.vercel.app",
      cancel_url: "https://neuro360-syc6.vercel.app",
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("Erro Stripe:", err);
    res.status(500).send("Erro ao criar pagamento");
  }
});

// 🔥 WEBHOOK (ATIVA PREMIUM AUTOMATICAMENTE)
app.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Erro webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const email = session.customer_email;

    console.log("Pagamento confirmado:", email);

    await supabase
      .from("usuarios")
      .update({ plano: "premium" })
      .eq("email", email);
  }

  res.json({ received: true });
});

app.listen(3001, () => {
  console.log("Servidor rodando 🚀");
});
