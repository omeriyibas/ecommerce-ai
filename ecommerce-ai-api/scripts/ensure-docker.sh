# Docker yoksa kurulum (Ubuntu/Debian). Kaynak: source scripts/ensure-docker.sh
ensure_docker() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    return 0
  fi

  echo "Docker bulunamadı; kuruluyor (sudo gerekir)..."
  sudo apt update
  sudo apt install -y docker.io docker-compose-v2

  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl enable --now docker
  fi

  if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
    echo "Docker kurulumu tamamlanamadı." >&2
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    echo "Docker kurulu ama bu kullanıcı erişemiyor." >&2
    echo "  sudo usermod -aG docker \"\$USER\"" >&2
    echo "Sonra oturumu kapatıp açın (veya: newgrp docker)." >&2
    exit 1
  fi

  echo "Docker hazır."
}
