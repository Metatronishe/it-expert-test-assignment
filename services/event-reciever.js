import 'dotenv/config';

const DEFAULT_TIMEOUT_MS = Number(process.env.POLLING_TIMEOUT_MS) || 10000;
const DEFAULT_INTERVAL_MS = Number(process.env.POLLING_INTERVAL_MS) || 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class EventReceiver {
  
    constructor(webhookSiteClient) {
    this.client = webhookSiteClient;
  }

  async awaitDelivery(tokenId, correlationId, options = {}) {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const requests = await this.client.getRequests(tokenId);
      const match = this._findMatchingRequest(requests, correlationId);

      if (match) {
        console.log(
          `[RECEIVE] correlationId=${correlationId} matched requestUuid=${match.uuid} after ${
            Date.now() - startedAt
          }ms`
        );
        return match.parsedBody;
      }

      await sleep(intervalMs);
    }

    throw new Error(
      `Timed out after ${timeoutMs}ms waiting for delivery of event with correlationId=${correlationId}`
    );
  }

  _findMatchingRequest(requests, correlationId) {
    for (const request of requests) {
      const parsedBody = JSON.parse(request.content);
      if (parsedBody?.correlationId === correlationId) {
        return { uuid: request.uuid, parsedBody };
      }
    }
    return null;
  }
}