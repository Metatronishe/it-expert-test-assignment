import 'dotenv/config';
import { WebhookSiteClient } from './clients/webhook-site.js';

export default async function globalTeardown() {
  const tokenId = process.env.WEBHOOK_SITE_TOKEN_ID;

  if (!tokenId) {
    return;
  }

  const client = new WebhookSiteClient();
  await client.deleteToken(tokenId);

  console.log(`[TEARDOWN] Deleted webhook.site endpoint: ${tokenId}`);
}