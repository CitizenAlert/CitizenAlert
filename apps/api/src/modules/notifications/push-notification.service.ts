import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

@Injectable()
export class PushNotificationService {
  private expo: Expo;
  private readonly logger = new Logger(PushNotificationService.name);

  constructor() {
    this.expo = new Expo();
  }

  async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    // Check if the push token is valid
    if (!Expo.isExpoPushToken(pushToken)) {
      this.logger.warn(`Push token ${pushToken} is not a valid Expo push token`);
      return;
    }

    const message: ExpoPushMessage = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
    };

    try {
      const tickets = await this.expo.sendPushNotificationsAsync([message]);
      this.handlePushTickets(tickets);
    } catch (error) {
      this.logger.error(`Error sending push notification: ${error.message}`);
    }
  }

  async sendPushNotifications(
    messages: Array<{
      pushToken: string;
      title: string;
      body: string;
      data?: Record<string, any>;
    }>,
  ): Promise<void> {
    const expoPushMessages: ExpoPushMessage[] = messages
      .filter((msg) => Expo.isExpoPushToken(msg.pushToken))
      .map((msg) => ({
        to: msg.pushToken,
        sound: 'default',
        title: msg.title,
        body: msg.body,
        data: msg.data,
        priority: 'high',
      }));

    if (expoPushMessages.length === 0) {
      return;
    }

    try {
      // The Expo push notification service accepts batches of notifications
      const chunks = this.expo.chunkPushNotifications(expoPushMessages);
      
      for (const chunk of chunks) {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        this.handlePushTickets(tickets);
      }
    } catch (error) {
      this.logger.error(`Error sending push notifications: ${error.message}`);
    }
  }

  private handlePushTickets(tickets: ExpoPushTicket[]): void {
    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        this.logger.error(
          `Error sending push notification: ${ticket.message}`,
          ticket.details,
        );
      } else if (ticket.status === 'ok') {
        this.logger.log(`Push notification sent successfully: ${ticket.id}`);
      }
    }
  }
}
