import 'dotenv/config';
import axios from 'axios';

const BASE_URL = process.env.WEBHOOK_SITE_BASE_URL || 'https://webhook.site';

export class WebhookSiteClient {
  constructor(baseUrl = BASE_URL) {
    this.http = axios.create({
      baseURL: baseUrl,
      timeout: 10000
    });
  }

  async createToken() {
    const response = await this.http.post('/token');
    return response.data;
  }

  async getRequests(tokenId) {
    const response = await this.http.get(`/token/${tokenId}/requests`);
    return response.data?.data ?? [];
  }

  async deleteToken(tokenId) {
    await this.http.delete(`/token/${tokenId}`);
  }

  async publishEvent(tokenId, eventBody) {
    const response = await this.http.post(`/${tokenId}`, eventBody);
    return response.data;
  }

  buildPublishUrl(tokenId) {
    return `${BASE_URL}/${tokenId}`;
  }
}