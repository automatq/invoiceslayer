---
description: How to build and push the InvoiceSlayer Docker image
---

To push your image to a registry (like Docker Hub), you must tag it with your username.

### 1. Log in to Docker
```bash
docker login
```

### 2. Build and Tag the Image
Replace `YOUR_USERNAME` with your actual Docker Hub username.
```bash
docker build -t YOUR_USERNAME/invoiceslayer:latest .
```

### 3. Push to Registry
```bash
docker push YOUR_USERNAME/invoiceslayer:latest
```

### Note on "Something with a tag"
If you tried to run `docker push invoiceslayer`, it will fail because Docker doesn't know which registry to send it to. By adding `YOUR_USERNAME/` as a prefix, you are "taging" it correctly for your personal Docker Hub repository.

### Using Docker Compose
If you just want to run it locally with the existing `docker-compose.yml`:
```bash
docker-compose up -d --build
```
