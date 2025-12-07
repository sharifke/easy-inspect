#!/bin/bash

# Template Management API Test Script
# ElektroInspect Phase 2

BASE_URL="http://localhost:5000/api"
echo "=========================================="
echo "Template Management API Test Script"
echo "=========================================="
echo ""

# 1. Login as Admin
echo "1. Login as Admin..."
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@elektroinspect.nl","password":"admin123"}')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.data.token')
echo "Admin Token: ${ADMIN_TOKEN:0:50}..."
echo ""

# 2. Login as Inspector
echo "2. Login as Inspector..."
INSPECTOR_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"inspecteur@elektroinspect.nl","password":"inspecteur123"}')

INSPECTOR_TOKEN=$(echo $INSPECTOR_RESPONSE | jq -r '.data.token')
echo "Inspector Token: ${INSPECTOR_TOKEN:0:50}..."
echo ""

# 3. GET all templates (as inspector)
echo "3. GET all templates (as inspector)..."
curl -s -X GET "$BASE_URL/templates" \
  -H "Authorization: Bearer $INSPECTOR_TOKEN" | jq '.status, .message, (.data.templates | length)'
echo ""

# 4. GET all templates (as admin)
echo "4. GET all templates (as admin)..."
TEMPLATES=$(curl -s -X GET "$BASE_URL/templates" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
TEMPLATE_ID=$(echo $TEMPLATES | jq -r '.data.templates[0].id')
echo "Status: $(echo $TEMPLATES | jq -r '.status')"
echo "Message: $(echo $TEMPLATES | jq -r '.message')"
echo "First Template ID: $TEMPLATE_ID"
echo ""

# 5. GET single template by ID
echo "5. GET single template by ID..."
curl -s -X GET "$BASE_URL/templates/$TEMPLATE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.status, .message, .data.template.name'
echo ""

# 6. CREATE new template (as admin)
echo "6. CREATE new template (as admin)..."
NEW_TEMPLATE=$(curl -s -X POST "$BASE_URL/templates" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Industrie Template",
    "description": "Template voor industriële installaties",
    "installationType": "industrie",
    "mainComponents": [
      {
        "name": "Hoogspanning",
        "description": "Inspectie hoogspanningsinstallaties",
        "subComponents": [
          {
            "name": "Transformator",
            "criterion": "Transformator staat correct afgesteld",
            "expectedOutcome": "Transformator functioneert binnen specificaties",
            "requiresPhoto": true
          }
        ]
      }
    ]
  }')
NEW_TEMPLATE_ID=$(echo $NEW_TEMPLATE | jq -r '.data.template.id')
echo "Status: $(echo $NEW_TEMPLATE | jq -r '.status')"
echo "Message: $(echo $NEW_TEMPLATE | jq -r '.message')"
echo "New Template ID: $NEW_TEMPLATE_ID"
echo ""

# 7. UPDATE template (as admin)
echo "7. UPDATE template (as admin)..."
curl -s -X PUT "$BASE_URL/templates/$NEW_TEMPLATE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Industrie Template (Updated)",
    "description": "Bijgewerkte template voor industriële installaties"
  }' | jq '.status, .message, .data.template.name'
echo ""

# 8. DUPLICATE template (as admin)
echo "8. DUPLICATE template (as admin)..."
DUPLICATED=$(curl -s -X POST "$BASE_URL/templates/$TEMPLATE_ID/duplicate" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Duplicated Template for Testing"
  }')
DUPLICATED_ID=$(echo $DUPLICATED | jq -r '.data.template.id')
echo "Status: $(echo $DUPLICATED | jq -r '.status')"
echo "Message: $(echo $DUPLICATED | jq -r '.message')"
echo "Duplicated Template ID: $DUPLICATED_ID"
echo "Main Components Count: $(echo $DUPLICATED | jq '.data.template.mainComponents | length')"
echo ""

# 9. DELETE template (as admin)
echo "9. DELETE template (as admin)..."
curl -s -X DELETE "$BASE_URL/templates/$NEW_TEMPLATE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.status, .message, .data.template.active'
echo ""

# 10. Try to CREATE template as inspector (should fail)
echo "10. Try to CREATE template as inspector (should fail)..."
curl -s -X POST "$BASE_URL/templates" \
  -H "Authorization: Bearer $INSPECTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Unauthorized Template",
    "installationType": "woning",
    "mainComponents": [{"name": "Test"}]
  }' | jq '.status, .message'
echo ""

# 11. Try to access without authentication (should fail)
echo "11. Try to access without authentication (should fail)..."
curl -s -X GET "$BASE_URL/templates" | jq '.status, .message'
echo ""

echo "=========================================="
echo "All tests completed!"
echo "=========================================="
