import 'dotenv/config';
import { WebhookSiteClient } from './clients/webhook-site.js';

export default async function globalSetup() {
  const client = new WebhookSiteClient();
  const token = await client.createToken();

  process.env.WEBHOOK_SITE_TOKEN_ID = token.uuid;

  console.log(`[SETUP] Created webhook.site endpoint: ${client.buildPublishUrl(token.uuid)}`);
}