# People X Deployment Guide

## Overview

This document provides comprehensive instructions for deploying People X, a full-featured HR management system that replicates the functionality of Zoho People. People X is designed to be deployed in various environments, from development to production, and supports both on-premises and cloud deployments.

## System Requirements

### Hardware Requirements

- **Application Server**:
  - CPU: 4+ cores
  - RAM: 8GB minimum, 16GB recommended
  - Storage: 100GB SSD minimum

- **Database Server**:
  - CPU: 4+ cores
  - RAM: 16GB minimum, 32GB recommended
  - Storage: 500GB SSD minimum

- **File Storage**:
  - 1TB minimum for document storage, attachments, and backups

### Software Requirements

- **Operating System**:
  - Linux (Ubuntu 20.04 LTS or later recommended)
  - Windows Server 2019 or later

- **Database**:
  - PostgreSQL 13.0 or later
  - MongoDB 5.0 or later (for document storage)
  - Redis 6.0 or later (for caching and session management)

- **Application Environment**:
  - Node.js 16.x or later
  - npm 8.x or later

- **Web Server**:
  - Nginx 1.20 or later (recommended)
  - Apache 2.4 or later

- **SSL Certificate**:
  - Valid SSL certificate for production deployments

## Architecture Overview

People X follows a modern microservices architecture:

1. **Frontend**: React-based SPA with Material UI
2. **Backend API**: Node.js/Express RESTful API services
3. **Database Layer**: PostgreSQL for relational data, MongoDB for document storage
4. **Caching Layer**: Redis for performance optimization
5. **File Storage**: Local or cloud-based storage for documents and attachments
6. **Authentication**: JWT-based authentication with role-based access control

## Deployment Options

### Option 1: Docker Deployment (Recommended)

People X can be deployed using Docker and Docker Compose for simplified setup and management.

#### Prerequisites

- Docker 20.10 or later
- Docker Compose 2.0 or later

#### Deployment Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/peoplex/peoplex.git
   cd peoplex
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

3. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

4. Initialize the database:
   ```bash
   docker-compose exec backend npm run db:init
   ```

5. Create an admin user:
   ```bash
   docker-compose exec backend npm run create-admin
   ```

6. Access the application at `https://your-domain.com` or `http://localhost:3000` for local deployments.

### Option 2: Manual Deployment

For environments where Docker is not available, People X can be deployed manually.

#### Backend Deployment

1. Install Node.js and npm:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. Install PostgreSQL, MongoDB, and Redis:
   ```bash
   sudo apt-get install postgresql mongodb redis-server
   ```

3. Clone the repository:
   ```bash
   git clone https://github.com/peoplex/peoplex.git
   cd peoplex
   ```

4. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

5. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

6. Initialize the database:
   ```bash
   npm run db:init
   ```

7. Start the backend service:
   ```bash
   npm run build
   npm run start
   ```

8. For production, set up a process manager:
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name peoplex-backend
   pm2 save
   pm2 startup
   ```

#### Frontend Deployment

1. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your API endpoint
   ```

3. Build the frontend:
   ```bash
   npm run build
   ```

4. Configure Nginx to serve the frontend:
   ```bash
   sudo nano /etc/nginx/sites-available/peoplex
   ```

   Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           root /path/to/peoplex/frontend/build;
           try_files $uri /index.html;
       }

       location /api {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/peoplex /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. Set up SSL with Let's Encrypt:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Multi-Tenant Configuration

People X supports multi-tenant deployments where multiple organizations can use the same instance with complete data isolation.

### Enabling Multi-Tenancy

1. Set the multi-tenancy flag in the environment:
   ```
   MULTI_TENANT_ENABLED=true
   ```

2. Configure the tenant identification method:
   ```
   TENANT_IDENTIFICATION_METHOD=domain
   # Options: domain, subdomain, path, header
   ```

3. For domain-based identification, configure DNS for each tenant:
   - tenant1.peoplex.com
   - tenant2.peoplex.com

4. For subdomain-based identification, configure a wildcard DNS record:
   - *.peoplex.com

## Scaling Considerations

For larger deployments, consider the following scaling strategies:

### Horizontal Scaling

1. Deploy multiple backend instances behind a load balancer
2. Configure session affinity if needed
3. Scale the database with read replicas
4. Implement a distributed caching strategy with Redis Cluster

### Vertical Scaling

1. Increase resources for application and database servers
2. Optimize database queries and indexes
3. Implement database partitioning for large tables

## Backup and Recovery

Implement a robust backup strategy:

1. Database backups:
   ```bash
   # PostgreSQL backup
   pg_dump -U postgres peoplex > peoplex_backup_$(date +%Y%m%d).sql

   # MongoDB backup
   mongodump --db peoplex --out /backup/$(date +%Y%m%d)
   ```

2. File storage backups:
   ```bash
   rsync -av /path/to/peoplex/uploads/ /backup/uploads/
   ```

3. Automate backups with cron jobs:
   ```bash
   # Add to crontab
   0 2 * * * /path/to/backup_script.sh
   ```

4. Test recovery procedures regularly

## Security Considerations

1. Keep all software components updated
2. Configure firewalls to restrict access
3. Implement rate limiting for API endpoints
4. Use strong passwords and enforce password policies
5. Enable audit logging for all sensitive operations
6. Regularly review security logs
7. Implement data encryption at rest and in transit

## Health Monitoring

1. Set up monitoring for all services:
   - Application server
   - Database servers
   - Redis
   - File storage
   - Network connectivity

2. Configure alerts for critical issues:
   - High CPU/memory usage
   - Disk space warnings
   - Service unavailability
   - Error rate thresholds

3. Implement application-level health checks:
   ```
   GET /api/health
   ```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Check database credentials in .env file
   - Verify database service is running
   - Check network connectivity and firewall rules

2. **API Errors**:
   - Check backend logs: `pm2 logs peoplex-backend`
   - Verify environment variables are correctly set
   - Check for disk space issues

3. **Frontend Loading Issues**:
   - Verify API endpoint configuration
   - Check browser console for JavaScript errors
   - Verify Nginx configuration

4. **Performance Issues**:
   - Check database query performance
   - Monitor Redis cache hit rates
   - Review application logs for slow operations

## Upgrade Procedures

1. Backup all data before upgrading
2. Review release notes for breaking changes
3. For Docker deployments:
   ```bash
   git pull
   docker-compose down
   docker-compose build
   docker-compose up -d
   docker-compose exec backend npm run db:migrate
   ```

4. For manual deployments:
   ```bash
   git pull
   cd backend
   npm install
   npm run build
   npm run db:migrate
   pm2 restart peoplex-backend

   cd ../frontend
   npm install
   npm run build
   ```

## Support and Resources

- Documentation: https://docs.peoplex.com
- GitHub Repository: https://github.com/peoplex/peoplex
- Issue Tracker: https://github.com/peoplex/peoplex/issues
- Community Forum: https://community.peoplex.com

For enterprise support, contact support@peoplex.com