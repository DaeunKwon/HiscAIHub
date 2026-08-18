#!/usr/bin/env bash
# EC2 서버에서 실행되는 배포 스크립트. GitHub Actions 가 push 마다 SSH 로 호출한다.
#   사용: bash deploy/deploy.sh   (리포 루트에서)
set -euo pipefail

cd "$(dirname "$0")/.."
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> [1/4] git pull"
git fetch origin main
git reset --hard origin/main

echo "==> [2/4] build & start"
$COMPOSE up -d --build postgres app

echo "==> [3/4] prisma migrate deploy"
$COMPOSE --profile tools run --rm --build migrate

echo "==> [4/4] cleanup"
docker image prune -f >/dev/null

$COMPOSE ps
echo "==> deploy done"
