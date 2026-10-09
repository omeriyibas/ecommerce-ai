#!/usr/bin/env bash
# API + Redis (+ monitoring varsa grafana/...)
# Varsayılan: ön plan (Ctrl+C ile durur). Arka plan: -d
#
# Kullanım (ecommerce-ai-api/ içinden):
#   ./scripts/run.sh              # build + up (foreground)
#   ./scripts/run.sh up           # aynı
#   ./scripts/run.sh up -d        # arka plan
#   ./scripts/run.sh start        # up -d (arka plan)
#   ./scripts/run.sh api          # yalnız compose.yml (foreground)
#   ./scripts/run.sh api -d       # yalnız compose.yml (arka plan)
#   ./scripts/run.sh down         # durdur
#   ./scripts/run.sh logs         # log takibi
#   ./scripts/run.sh rebuild [-d] # --build --force-recreate
#   ./scripts/run.sh migrate      # alembic (stack ayaktayken)
# API: http://127.0.0.1:8000
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=ensure-docker.sh
source "$ROOT/scripts/ensure-docker.sh"
ensure_docker

COMPOSE_BASE=(docker compose -f docker-compose.yml)
COMPOSE_FULL=(
  docker compose
  -f docker-compose.yml
  -f docker-compose.monitoring.yml
)

if [[ ! -f .env.docker ]]; then
  echo ".env.docker yok. Önce: cp .env.docker.example .env.docker" >&2
  exit 1
fi

use_monitoring() {
  [[ "${USE_MONITORING:-1}" == "1" && -f docker-compose.monitoring.yml ]]
}

compose_cmd() {
  if use_monitoring; then
    echo "${COMPOSE_FULL[@]}"
  else
    echo "${COMPOSE_BASE[@]}"
  fi
}

docker_up() {
  local rebuild=0
  local detach=0
  local arg
  for arg in "$@"; do
    case "$arg" in
      rebuild) rebuild=1 ;;
      -d|--detach) detach=1 ;;
    esac
  done

  local extra=(--build)
  if [[ "$rebuild" -eq 1 ]]; then
    extra+=(--force-recreate)
  fi
  if [[ "$detach" -eq 1 ]]; then
    extra+=(-d --remove-orphans)
  fi

  local -a cmd
  # shellcheck disable=SC2207
  cmd=($(compose_cmd))
  if use_monitoring; then
    if [[ "$detach" -eq 1 ]]; then
      echo "API: http://127.0.0.1:8000  Grafana: http://127.0.0.1:3000 (arka plan)"
    else
      echo "API: http://127.0.0.1:8000  Grafana: http://127.0.0.1:3000 — Ctrl+C ile durdur"
    fi
  else
    if [[ "$detach" -eq 1 ]]; then
      echo "API: http://127.0.0.1:8000  (docs: /docs) — arka plan"
    else
      echo "API: http://127.0.0.1:8000  (docs: /docs) — Ctrl+C ile durdur"
    fi
  fi
  "${cmd[@]}" up "${extra[@]}"
  if [[ "$detach" -eq 1 ]]; then
    echo "Durdurmak: ./scripts/run.sh down"
    echo "Loglar:    ./scripts/run.sh logs"
  fi
}

docker_down() {
  local -a cmd
  # shellcheck disable=SC2207
  cmd=($(compose_cmd))
  "${cmd[@]}" down
  echo "Stack durduruldu."
}

docker_logs() {
  local -a cmd
  # shellcheck disable=SC2207
  cmd=($(compose_cmd))
  "${cmd[@]}" logs -f api
}

docker_migrate() {
  local -a cmd
  # shellcheck disable=SC2207
  cmd=($(compose_cmd))
  "${cmd[@]}" exec api uv run alembic upgrade head
}

cmd="${1:-up}"
shift || true
case "$cmd" in
  up)
    docker_up "$@"
    ;;
  start)
    docker_up -d "$@"
    ;;
  rebuild)
    docker_up rebuild "$@"
    ;;
  down)
    docker_down
    ;;
  logs)
    docker_logs
    ;;
  migrate)
    docker_migrate
    ;;
  api)
    USE_MONITORING=0 docker_up "$@"
    ;;
  *)
    echo "Kullanım: $0 {up|start|down|logs|rebuild|migrate|api} [-d]" >&2
    exit 1
    ;;
esac
