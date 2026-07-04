import { v7 as uuidv7 } from 'uuid';
import { faker } from '@faker-js/faker';

const EVENT_ID_PREFIX = 'evt-';
const EVENT_TYPE_ORDER_CREATED = 'OrderCreated';

function buildOrderItem() {
  return {
    productId: `prod-${uuidv7()}`,
    name: faker.commerce.productName(),
    quantity: faker.number.int({ min: 1, max: 5 }),
    unitPrice: Number(faker.commerce.price({ min: 5, max: 500 }))
  };
}

function buildShippingAddress() {
  return {
    country: faker.location.countryCode(),
    city: faker.location.city(),
    postalCode: faker.location.zipCode(),
    street: faker.location.streetAddress()
  };
}

function buildOrderPayload() {
  const items = faker.helpers.multiple(buildOrderItem, {
    count: faker.number.int({ min: 1, max: 3 })
  });

  const totalAmount = Number(
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2)
  );

  return {
    orderId: `ord-${uuidv7()}`,
    customerId: `cust-${uuidv7()}`,
    items,
    totalAmount,
    currency: 'USD',
    shippingAddress: buildShippingAddress(),
    status: 'created'
  };
}

export function buildOrderCreatedEvent() {
  return {
    eventId: `${EVENT_ID_PREFIX}${uuidv7()}`,
    eventType: EVENT_TYPE_ORDER_CREATED,
    correlationId: uuidv7(),
    timestamp: new Date().toISOString(),
    payload: buildOrderPayload()
  };
}