import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔥 CRIAR CHECKOUT
app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "NeuroMapa360 Premium",
            },
            unit_amount: 1990, // R$19,90
          },
          quantity: 1,
        },
      ],
      success_url: "https://SEU-APP.vercel.app/sucesso",
      cancel_url: "https://SEU-APP.vercel.app/cancelado",
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao criar checkout");
  }
});

app.listen(3001, () => {
  console.log("Servidor com Stripe rodando 💰");
});
