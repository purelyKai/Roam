package com.roam.backend.util;

import io.github.cdimascio.dotenv.Dotenv;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class StripeWebhookController {

  private final String webhookSecret;

  public StripeWebhookController() {
    Dotenv dotenv = Dotenv.load();
    this.webhookSecret = dotenv.get("STRIPE_WEBHOOK_SECRET");
  }

  @PostMapping(value = "/webhook", consumes = "application/json")
  public ResponseEntity<String> handleStripeWebhook(
      @RequestBody String payload,
      @RequestHeader("Stripe-Signature") String sigHeader
  ) {

    Event event;
    try {
      event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
    } catch (SignatureVerificationException e) {
      return ResponseEntity.status(400).body("Invalid signature");
    }

    if ("checkout.session.completed".equals(event.getType())) {
      // Safely deserialize inner object
      EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
      StripeObject obj = deserializer.getObject().orElse(null);
      Session session = (obj instanceof Session) ? (Session) obj : null; // session object i think

      // LOGIC HERE AFTER SUCCESSFUL PURCHASE
      System.out.println("SUCCESSFUL CHECKOUT SESSION");

      return ResponseEntity.ok("Processed checkout.session.completed");
    }

    return ResponseEntity.ok("OK");
  }
}
