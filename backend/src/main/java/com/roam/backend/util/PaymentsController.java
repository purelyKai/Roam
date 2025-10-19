package com.roam.backend.util;

import io.github.cdimascio.dotenv.Dotenv;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = {
  "http://localhost:19006", // Expo web
  "http://localhost:8081",  // Metro web
  "http://127.0.0.1:19006",
  "http://10.0.2.2:19006"   // Android emulator (rarely used as Origin)
})
public class PaymentsController {

  private final String successUrl;
  private final String cancelUrl;

  public PaymentsController() {
    Dotenv dotenv = Dotenv.load();

    Stripe.apiKey = dotenv.get("STRIPE_SECRET");
    this.successUrl = "https://www.google.com"; // todo - add successful payment page
    this.cancelUrl  = "https://www.bing.com"; // todo - add canceled payement page
  }


  @PostMapping("/create-checkout-session")
  public String createCheckoutSession(@RequestParam String priceId, @RequestParam(defaultValue = "1") Long qty)
    throws StripeException {

    SessionCreateParams params = SessionCreateParams.builder()
        .setMode(SessionCreateParams.Mode.PAYMENT)
        .setSuccessUrl(successUrl)
        .setCancelUrl(cancelUrl)
        .addLineItem(
          SessionCreateParams.LineItem.builder()
            .setPrice(priceId)
            .setQuantity(qty)
            .build()
        )
        .build();

    Session session = Session.create(params);
    return session.getUrl();
  }
}
