#!/bin/bash
echo "Testing GET /api/doctor/layout endpoint..."
curl -s http://localhost:3000/api/doctor/layout | jq '.' || echo "Server not running or endpoint failed"
