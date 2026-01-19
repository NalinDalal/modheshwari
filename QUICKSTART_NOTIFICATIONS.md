# Quick Start Guide - Notification System

## TL;DR

```bash
# 1. Run setup script
chmod +x scripts/setup-notifications.sh
./scripts/setup-notifications.sh

# 2. Configure .env
nano .env  # Add your email/Firebase credentials

# 3. Start workers
npm run worker:notifications

# 4. Test the API
curl -X POST http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test notification",
    "channels": ["IN_APP", "EMAIL"],
    "type": "ANNOUNCEMENT"
  }'
```

## What You Get

✅ **Multi-channel notifications**: In-app, Email, Push, SMS  
✅ **Kafka-based pub/sub**: Reliable, scalable message delivery  
✅ **Multiple email providers**: SMTP, SendGrid, AWS SES  
✅ **Firebase push notifications**: Android, iOS, Web  
✅ **User preferences**: Respect notification settings  
✅ **Event-driven**: Decoupled architecture  

## Architecture Overview

```
User Request → Producer → Kafka → Workers → Delivery
                                    ├─ Email
                                    ├─ Push
                                    ├─ In-App
                                    └─ SMS
```

## Email Setup (Choose One)

### Gmail SMTP
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Get from Google Account settings
```

### SendGrid
```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxx
```

### AWS SES
```bash
EMAIL_PROVIDER=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

## Push Notifications Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project → Project Settings → Service Accounts
3. Generate new private key (downloads JSON)
4. Add to .env:

```bash
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"..."}'
```

## Running Workers

### Development (All in one)
```bash
npm run worker:notifications
```

### Production (Separate processes)
```bash
# Terminal 1
CONSUMER_TYPE=router npm run worker:notifications

# Terminal 2
CONSUMER_TYPE=email npm run worker:notifications

# Terminal 3
CONSUMER_TYPE=push npm run worker:notifications
```

## Usage Examples

### Broadcast to All Members
```typescript
await broadcastNotification({
  message: "Community meeting next week",
  type: "ANNOUNCEMENT",
  channels: ["IN_APP", "EMAIL", "PUSH"],
  recipientIds: userIds,
  priority: "high"
});
```

### Event Registration
```typescript
await notifyEventRegistration({
  userId: "user123",
  eventName: "Annual Gathering",
  eventDate: new Date("2026-02-15"),
  eventLocation: "Main Hall"
});
```

### Resource Request Alert
```typescript
await notifyResourceRequest({
  requesterId: "user123",
  approverIds: ["admin1", "admin2"],
  resourceType: "Financial Aid",
  description: "Medical emergency"
});
```

## Monitoring

- **Kafka UI**: http://localhost:8080
- **Worker logs**: Check console output
- **Database**: Query `Notification` table

## Common Issues

### Kafka not starting
```bash
docker-compose -f docker-compose.kafka.yml down
docker-compose -f docker-compose.kafka.yml up -d
```

### Email not sending
- Check SMTP credentials
- Verify Gmail "Less secure apps" or use App Password
- Check spam folder

### Push notifications not working
- Verify Firebase credentials format
- Ensure FCM tokens are stored in user profiles
- Test in Firebase console first

## Next Steps

1. ✅ Read [NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md) for details
2. ✅ Configure user notification preferences
3. ✅ Create custom email templates
4. ✅ Set up monitoring/alerts
5. ✅ Scale workers for production

## Support

Check [NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md) for:
- Detailed architecture
- Scaling strategies
- Error handling
- Best practices
- Troubleshooting
