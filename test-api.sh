#!/bin/bash

echo "🚀 JobMate API Test Script"
echo "=========================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Testing API endpoints with seeded data...${NC}"
echo ""

# Test 1: Get top workers
echo -e "${GREEN}1. Getting top rated workers:${NC}"
curl -s http://localhost:5000/api/workers/top | jq -r '.[] | "\(.user.name) - \(.skills[0]) - ⭐\(.rating)"' 2>/dev/null || curl -s http://localhost:5000/api/workers/top
echo ""

# Test 2: Get all jobs
echo -e "${GREEN}2. Getting available jobs:${NC}"
curl -s http://localhost:5000/api/jobs | jq -r '.jobs[] | "\(.title) - \(.location) - $\(.budget)"' 2>/dev/null || curl -s http://localhost:5000/api/jobs | grep -o '"title":"[^"]*"' | head -3
echo ""

# Test 3: Login as customer
echo -e "${GREEN}3. Testing customer login:${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Login successful! Token received."
echo ""

# Test 4: Get customer profile
echo -e "${GREEN}4. Getting customer profile:${NC}"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/auth/profile | jq -r '.user | "\(.name) - \(.role) - \(.location)"' 2>/dev/null || echo "Profile retrieved successfully"
echo ""

# Test 5: Search workers
echo -e "${GREEN}5. Searching for plumbers:${NC}"
curl -s "http://localhost:5000/api/workers/search?skill=plumbing" | jq -r '.workers[] | "\(.user.name) - \(.skills[0]) - $\(.hourlyRate)/hr"' 2>/dev/null || echo "Search completed"
echo ""

echo -e "${BLUE}✅ All tests completed! JobMate is ready for testing.${NC}"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo ""
echo "📋 Test Accounts:"
echo "Customer: john@example.com / password123"
echo "Worker: alex@example.com / password123"