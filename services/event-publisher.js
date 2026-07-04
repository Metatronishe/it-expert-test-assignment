export class EventPublisher {
    
    constructor(webhookSiteClient) {
      this.client = webhookSiteClient;
    }
  
    async publish(tokenId, event) {
      console.log('[Publish]', JSON.stringify(event, null, 2));
      await this.client.publishEvent(tokenId, event);
    }
  }