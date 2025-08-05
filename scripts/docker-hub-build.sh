#!/bin/bash

# Build and push AI Town to Docker Hub
# Usage: ./scripts/docker-hub-build.sh [tag] [language]

set -e

# Configuration
DOCKER_USERNAME=${DOCKER_USERNAME:-"lingelo"}
IMAGE_NAME="ai-town"
TAG=${1:-"latest"}
LANGUAGE=${2:-"en"}
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}"

echo "🏗️  Building AI Town Docker image for Docker Hub"
echo "📦 Image: ${FULL_IMAGE_NAME}:${TAG}"
echo "🌍 Language: ${LANGUAGE}"
echo ""

# Build the image
echo "🔨 Building Docker image..."
docker build \
  -f Dockerfile.hub \
  --build-arg VITE_LANGUAGE=${LANGUAGE} \
  --build-arg BUILD_VERSION=${TAG} \
  --platform linux/amd64,linux/arm64 \
  -t "${FULL_IMAGE_NAME}:${TAG}" \
  -t "${FULL_IMAGE_NAME}:latest" \
  .

echo "✅ Image built successfully!"

# Test the image locally
echo "🧪 Testing image locally..."
CONTAINER_ID=$(docker run -d -p 8080:80 "${FULL_IMAGE_NAME}:${TAG}")
sleep 5

if curl -f http://localhost:8080 > /dev/null 2>&1; then
  echo "✅ Image test successful!"
else
  echo "❌ Image test failed!"
  docker logs $CONTAINER_ID
  docker stop $CONTAINER_ID
  exit 1
fi

# Clean up test container
docker stop $CONTAINER_ID
docker rm $CONTAINER_ID

# Push to Docker Hub
echo "📤 Pushing to Docker Hub..."
echo "Please make sure you're logged in with: docker login"
read -p "Continue with push? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🚀 Pushing ${FULL_IMAGE_NAME}:${TAG}..."
  docker push "${FULL_IMAGE_NAME}:${TAG}"
  
  if [[ "${TAG}" != "latest" ]]; then
    echo "🚀 Pushing ${FULL_IMAGE_NAME}:latest..."
    docker push "${FULL_IMAGE_NAME}:latest"
  fi
  
  echo ""
  echo "🎉 Successfully pushed to Docker Hub!"
  echo "📍 Image available at: https://hub.docker.com/r/${DOCKER_USERNAME}/${IMAGE_NAME}"
  echo ""
  echo "🔧 To use this image:"
  echo "   docker run -p 80:80 ${FULL_IMAGE_NAME}:${TAG}"
  echo ""
  echo "🌐 With custom language:"
  echo "   docker run -p 80:80 -e VITE_LANGUAGE=fr ${FULL_IMAGE_NAME}:${TAG}"
else
  echo "❌ Push cancelled"
fi

echo ""
echo "📋 Image details:"
echo "   Name: ${FULL_IMAGE_NAME}:${TAG}"
echo "   Language: ${LANGUAGE}"
echo "   Size: $(docker images ${FULL_IMAGE_NAME}:${TAG} --format 'table {{.Size}}')"