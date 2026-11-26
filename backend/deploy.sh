#!/usr/bin/env bash
# ==============================================================================
# Saheli AI - Cloud Run Deployment Script (Member 5: Cloud Architecture)
# ==============================================================================
# Pre-requisites:
# 1. Google Cloud SDK installed and authenticated (`gcloud auth login`)
# 2. Project configured (`gcloud config set project <PROJECT_ID>`)
# 3. Required APIs enabled: Cloud Run, Artifact Registry, Secret Manager, Firestore
#
# NOTE: This script is prepared for production deployment. Never commit real keys.
# ==============================================================================

set -euo pipefail

# Configuration Defaults (override via environment variables)
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-saheli-ai-prod}"
REGION="${GOOGLE_CLOUD_REGION:-asia-south1}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-saheli-backend}"
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/saheli-repo/${SERVICE_NAME}:latest"
SERVICE_ACCOUNT="saheli-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com"
STORAGE_BUCKET="${GOOGLE_CLOUD_STORAGE_BUCKET:-saheli-reports-prod}"

echo "============================================================"
echo " Deploying Saheli AI to Google Cloud Run"
echo " Project:         ${PROJECT_ID}"
echo " Region:          ${REGION}"
echo " Service:         ${SERVICE_NAME}"
echo " Service Account: ${SERVICE_ACCOUNT}"
echo "============================================================"

# 1. Verify Authentication & Project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ "${CURRENT_PROJECT}" != "${PROJECT_ID}" ]; then
  echo "Setting active gcloud project to ${PROJECT_ID}..."
  gcloud config set project "${PROJECT_ID}"
fi

# 2. Build Container Image via Cloud Build or Docker
echo "Building container image..."
gcloud builds submit --tag "${IMAGE_NAME}" .

# 3. Deploy to Cloud Run
# - Uses Application Default Credentials (ADC) attached to the runtime service account
# - Injects GEMINI_API_KEY from Secret Manager (never passed in plain text)
# - Connects to Cloud Firestore and Cloud Storage
echo "Deploying container to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_NAME}" \
  --region "${REGION}" \
  --platform managed \
  --service-account "${SERVICE_ACCOUNT}" \
  --set-env-vars "ENV=production,GOOGLE_CLOUD_PROJECT=${PROJECT_ID},FIREBASE_PROJECT_ID=${PROJECT_ID},GOOGLE_CLOUD_STORAGE_BUCKET=${STORAGE_BUCKET},ENABLE_DEMO_MOCKS=false" \
  --set-secrets "GEMINI_API_KEY=saheli-gemini-api-key:latest" \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60s \
  --port 8080

echo "Deployment complete! Verifying health endpoint..."
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --platform managed --region "${REGION}" --format 'value(status.url)')
echo "Service URL: ${SERVICE_URL}"
curl -s "${SERVICE_URL}/health" | jq .
