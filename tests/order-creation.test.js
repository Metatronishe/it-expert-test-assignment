import { WebhookSiteClient } from '../clients/webhook-site.js';
import { EventPublisher } from '../services/event-publisher.js';
import { EventReceiver } from '../services/event-reciever.js';
import { buildOrderCreatedEvent } from '../fixtures/order-event-factory.js';

describe('Event Bus - OrderCreated publish & receive', () => {
  const tokenId = process.env.WEBHOOK_SITE_TOKEN_ID;
  const client = new WebhookSiteClient();
  const publisher = new EventPublisher(client);
  const receiver = new EventReceiver(client);

  it('publishes an OrderCreated event and receives it via webhook.site', async () => {
    const event = buildOrderCreatedEvent();

    await publisher.publish(tokenId, event);

    const received = await receiver.awaitDelivery(tokenId, event.correlationId, {
      timeoutMs: 10000
    });

    expect(received.eventType).toBe(event.eventType);
    expect(received.correlationId).toBe(event.correlationId);
    expect(received.timestamp).toBe(event.timestamp);
    expect(received.payload).toEqual(event.payload);
  });
});