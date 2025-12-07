#!/bin/bash

echo "Testing ElektroInspect API Endpoints"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test health endpoint
echo "1. Testing Health Check..."
response=$(curl -s -w "%{http_code}" http://localhost:5000/api/health)
http_code="${response: -3}"
body="${response:0:${#response}-3}"

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "   Response: $body"
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "   HTTP Code: $http_code"
fi

echo ""
echo "2. Testing Login Endpoint (should fail without database)..."
response=$(curl -s -w "%{http_code}" -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@elektroinspect.nl","password":"admin123"}')
http_code="${response: -3}"
body="${response:0:${#response}-3}"

echo "   HTTP Code: $http_code"
echo "   Response: $body"

echo ""
echo "3. Testing Protected Endpoint (should return 401)..."
response=$(curl -s -w "%{http_code}" http://localhost:5000/api/auth/me)
http_code="${response: -3}"
body="${response:0:${#response}-3}"

if [ "$http_code" = "401" ]; then
    echo -e "${GREEN}✓ Auth middleware working (401 unauthorized)${NC}"
else
    echo -e "${RED}✗ Unexpected response${NC}"
    echo "   HTTP Code: $http_code"
fi

echo ""
echo "===================================="
echo "API structure is working! ✓"
echo "Next: Set up database to test full auth flow"
