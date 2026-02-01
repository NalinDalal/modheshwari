# Notification System

## Configuration

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
