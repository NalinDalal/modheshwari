# Notification System

A production-grade, event-driven notification system using Kafka for pub/sub messaging, supporting multiple delivery channels (in-app, email, push, SMS).

## Architecture

```
┌─────────────────┐
│   API Request   │
│  (Broadcast)    │
└────────┬────────┘
         │
         v
┌─────────────────────────┐
│ Notification Producer   │
│ - Fetch recipients      │
│ - Apply permissions     │
│ - Publish to Kafka      │
└────────┬────────────────┘
         │
         v
┌─────────────────────────┐
│   Kafka Topics          │
│ - notification.events   │
│ - notification.email    │
│ - notification.push     │
│ - notification.sms      │
└────────┬────────────────┘
         │
         v
┌─────────────────────────┐
│  Consumer Workers       │
│ ┌─────────────────────┐ │
│ │ Router Consumer     │ │
│ │ - Routes to channels│ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Email Consumer      │ │
│ │ - SMTP/SendGrid/SES │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Push Consumer       │ │
│ │ - Firebase FCM      │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ SMS Consumer        │ │
│ │ - Twilio/AWS SNS    │ │
│ └─────────────────────┘ │
└─────────────────────────┘
         │
         v
┌─────────────────────────┐
│   Delivery              │
│ - In-app (database)     │
│ - Email (inbox)         │
│ - Push (device)         │
│ - SMS (phone)           │
└─────────────────────────┘
```

## Features

- **Multi-channel delivery**: In-app, email, push notifications, SMS
- **Event-driven architecture**: Kafka for reliable message delivery
- **Horizontal scalability**: Run multiple consumer instances
- **User preferences**: Respect user notification settings
- **Rich templates**: HTML emails, customizable push notifications
- **Failure handling**: Invalid token cleanup, retry logic
- **Priority levels**: Low, normal, high, urgent
- **Role-based targeting**: Send to specific user groups

## Setup

### 1. Start Kafka

```bash
# Start Kafka and Zookeeper using Docker Compose
docker-compose -f docker-compose.kafka.yml up -d

# Verify Kafka is running
docker-compose -f docker-compose.kafka.yml ps

# View Kafka UI (optional)
open http://localhost:8080
```

### 2. Configure Environment

```bash
# Copy example configuration
cp .env.notification.example .env

# Edit .env and configure:
# - Kafka brokers
# - Email provider (SMTP/SendGrid/SES)
# - Firebase credentials for push notifications
```

### 3. Update Database Schema

```bash
cd packages/db
npx prisma migrate dev --name add-notification-features
```

### 4. Install Dependencies

```bash
# In apps/be directory
npm install kafkajs nodemailer firebase-admin

# Type definitions
npm install -D @types/nodemailer
```

### 5. Start Workers

```bash
# Start all notification workers
npm run worker:notifications

# Or start specific workers
CONSUMER_TYPE=router npm run worker:notifications
CONSUMER_TYPE=email npm run worker:notifications
CONSUMER_TYPE=push npm run worker:notifications
```

## Usage

### Broadcasting Notifications

```typescript
import { broadcastNotification } from "./services/notificationProducer";

// Send to multiple users
await broadcastNotification({
  message: "Community meeting scheduled for next week",
  type: "ANNOUNCEMENT",
  channels: ["IN_APP", "EMAIL", "PUSH"],
  subject: "Community Meeting",
  recipientIds: ["user1", "user2", "user3"],
  priority: "high",
  data: {
    meetingDate: "2026-01-25",
    location: "Community Hall",
  },
});
```

### Event Registration Notification

```typescript
import { notifyEventRegistration } from "./services/notificationProducer";

await notifyEventRegistration({
  userId: "user123",
  eventName: "Annual Gathering 2026",
  eventDate: new Date("2026-02-15"),
  eventLocation: "Main Hall",
});
```

### Resource Request Notification

```typescript
import { notifyResourceRequest } from "./services/notificationProducer";

await notifyResourceRequest({
  requesterId: "user123",
  approverIds: ["admin1", "admin2"],
  resourceType: "Financial Assistance",
  description: "Request for medical emergency support",
});
```

### Send Reminders

```typescript
import { sendReminder } from "./services/notificationProducer";

await sendReminder({
  userIds: ["user1", "user2"],
  message: "Event registration closes tomorrow!",
  data: { eventId: "event123" },
});
```

## API Endpoints

### POST /api/notifications

Broadcast notification (requires admin role)

**Request:**
```json
{
  "message": "Important community update",
  "type": "ANNOUNCEMENT",
  "channels": ["IN_APP", "EMAIL", "PUSH"],
  "subject": "Community Update",
  "targetRole": "MEMBER",
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": "notif_1234567890_abc123",
    "recipientCount": 150,
    "channels": ["IN_APP", "EMAIL", "PUSH"]
  },
  "message": "Notifications queued for delivery"
}
```

## Configuration

### Email Providers

#### SMTP (Gmail, Outlook, etc.)
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### SendGrid
```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-api-key
```

#### AWS SES
```bash
EMAIL_PROVIDER=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

### Push Notifications (Firebase)

1. Create Firebase project: https://console.firebase.google.com
2. Generate service account key
3. Configure environment:

```bash
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

### Notification Preferences

Users can control their notification preferences via their profile:

```json
{
  "notificationPreferences": {
    "emailEnabled": true,
    "pushEnabled": true,
    "smsEnabled": false,
    "categories": {
      "EVENT": true,
      "ANNOUNCEMENT": true,
      "RESOURCE_REQUEST": false
    }
  }
}
```

## Scaling

### Horizontal Scaling

Run multiple worker instances for each consumer type:

```bash
# Terminal 1: Router
CONSUMER_TYPE=router npm run worker:notifications

# Terminal 2: Email worker 1
CONSUMER_TYPE=email npm run worker:notifications

# Terminal 3: Email worker 2
CONSUMER_TYPE=email npm run worker:notifications

# Terminal 4: Push worker
CONSUMER_TYPE=push npm run worker:notifications
```

Each consumer group automatically distributes work among instances.

### Production Deployment

**Docker Compose:**
```yaml
services:
  notification-router:
    build: .
    command: npm run worker:notifications
    environment:
      CONSUMER_TYPE: router
      KAFKA_BROKERS: kafka:9093
    depends_on:
      - kafka
    deploy:
      replicas: 2

  notification-email:
    build: .
    command: npm run worker:notifications
    environment:
      CONSUMER_TYPE: email
      KAFKA_BROKERS: kafka:9093
      EMAIL_PROVIDER: sendgrid
    depends_on:
      - kafka
    deploy:
      replicas: 3

  notification-push:
    build: .
    command: npm run worker:notifications
    environment:
      CONSUMER_TYPE: push
      KAFKA_BROKERS: kafka:9093
    depends_on:
      - kafka
    deploy:
      replicas: 2
```

## Monitoring

### Kafka UI

Access Kafka UI at http://localhost:8080 to monitor:
- Topic messages
- Consumer lag
- Partition distribution
- Message throughput

### Logs

Workers log important events:
- `📨` Message received
- `✉️` Email sent
- `📱` Push notification sent
- `✅` Success
- `❌` Failure

## Error Handling

### Invalid FCM Tokens

Automatically removed from database when detected.

### Email Failures

Logged but don't block processing. Consider implementing:
- Dead-letter queue for retry
- Alert on high failure rates

### Rate Limiting

Email service includes basic rate limiting (100ms between emails). Adjust as needed:

```typescript
// In emailService.ts
await new Promise((resolve) => setTimeout(resolve, 100));
```

## Best Practices

1. **Use appropriate channels**: Don't send email for every notification
2. **Respect user preferences**: Always check notification settings
3. **Use templates**: Create reusable email/push templates
4. **Monitor consumer lag**: Keep Kafka consumers healthy
5. **Scale workers**: Add more workers during high volume
6. **Test thoroughly**: Verify all channels in staging

## Troubleshooting

### Kafka connection issues
```bash
# Check Kafka is running
docker-compose -f docker-compose.kafka.yml ps

# View logs
docker-compose -f docker-compose.kafka.yml logs kafka
```

### Emails not sending
- Verify SMTP credentials
- Check firewall/network settings
- Test with a simple nodemailer script

### Push notifications not working
- Verify Firebase credentials
- Check FCM tokens are valid
- Test with Firebase console

## Future Enhancements

- [ ] SMS integration (Twilio/AWS SNS)
- [ ] Notification scheduling
- [ ] Rich push notifications with images
- [ ] A/B testing for messages
- [ ] Analytics dashboard
- [ ] User notification history API
- [ ] Batch notification API
- [ ] WebSocket for real-time in-app notifications

## License

See main project LICENSE file.
