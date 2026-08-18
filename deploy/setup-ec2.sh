#!/usr/bin/env bash
# EC2(Ubuntu 22.04/24.04) 최초 1회 셋업: Docker 설치 + swap + 리포 clone
#   사용: curl -fsSL https://raw.githubusercontent.com/DaeunKwon/HiscAIHub/main/deploy/setup-ec2.sh | bash
set -euo pipefail

REPO="https://github.com/DaeunKwon/HiscAIHub.git"
APP_DIR="$HOME/HiscAIHub"

echo "==> Docker 설치"
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"

echo "==> swap 2GB (next build 메모리 부족 방지)"
if [ ! -f /swapfile ]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "==> 리포 clone"
if [ ! -d "$APP_DIR" ]; then
  git clone "$REPO" "$APP_DIR"
fi

cat <<MSG

셋업 완료. 다음 순서로 진행하세요:
  1) 재로그인 (docker 그룹 반영):  exit 후 다시 ssh
  2) cd $APP_DIR && cp .env.example .env && nano .env   # 운영 값으로 수정
  3) docker compose -f docker-compose.prod.yml up -d --build
  4) docker compose -f docker-compose.prod.yml --profile tools run --rm --build migrate
  5) docker compose -f docker-compose.prod.yml --profile tools run --rm seed   # 최초 1회
MSG
