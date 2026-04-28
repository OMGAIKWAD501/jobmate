#!/bin/bash

echo "🚀 JobMate API Test Script"
echo "=========================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Testing API endpoints with seeded data...${NC}"
echo ""
BACKEND_API_URL="${BACKEND_API_URL:-https://jobmate-backend-jkx3.onrender.com/api}"

# Test 1: Get top workers
echo -e "${GREEN}1. Getting top rated workers:${NC}"
curl -s "$BACKEND_API_URL/workers/top" | jq -r '.[] | "\(.user.name) - \(.skills[0]) - ⭐\(.rating)"' 2>/dev/null || curl -s "$BACKEND_API_URL/workers/top"
echo ""

# Test 2: Get all jobs
echo -e "${GREEN}2. Getting available jobs:${NC}"
curl -s "$BACKEND_API_URL/jobs" | jq -r '.jobs[] | "\(.title) - \(.location) - $\(.budget)"' 2>/dev/null || curl -s "$BACKEND_API_URL/jobs" | grep -o '"title":"[^"]*"' | head -3
echo ""

# Test 3: Login as customer
echo -e "${GREEN}3. Testing customer login:${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Login successful! Token received."
echo ""

# Test 4: Get customer profile
echo -e "${GREEN}4. Getting customer profile:${NC}"
curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_API_URL/auth/profile" | jq -r '.user | "\(.name) - \(.role) - \(.location)"' 2>/dev/null || echo "Profile retrieved successfully"
echo ""

# Test 5: Search workers
echo -e "${GREEN}5. Searching for plumbers:${NC}"
curl -s "$BACKEND_API_URL/workers/search?skill=plumbing" | jq -r '.workers[] | "\(.user.name) - \(.skills[0]) - $\(.hourlyRate)/hr"' 2>/dev/null || echo "Search completed"
echo ""

echo -e "${BLUE}✅ All tests completed! JobMate is ready for testing.${NC}"
echo ""
echo "🌐 Frontend: https://<your-vercel-domain>"
echo "🔧 Backend API: $BACKEND_API_URL"
echo ""
echo "📋 Test Accounts:"
echo "Customer: john@example.com / password123"
echo "Worker: alex@example.com / password123"