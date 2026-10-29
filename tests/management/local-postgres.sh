#!/usr/bin/env bash
# Local synthetic tests only. Never use this trust-authenticated cluster for real family data.
set -euo pipefail

pg_root=${MANAGEMENT_PG_ROOT:-/workspace/.cache/management-postgres}
pg_port=${MANAGEMENT_PG_PORT:-55432}
pg_database=${MANAGEMENT_PG_DATABASE:-sparkle_management_test}
if [[ ! "$pg_port" =~ ^[0-9]+$ ]] || [[ ! "$pg_database" =~ ^[a-z_][a-z0-9_]*_test$ ]]; then
  echo 'Use a numeric local port and a database name ending in _test.' >&2
  exit 2
fi
if [[ $(id -u) == 0 ]]; then
  echo 'Run this local PostgreSQL test cluster as an unprivileged user.' >&2
  exit 2
fi
pg_bin="$pg_root/root/usr/lib/postgresql/17/bin"
if [[ ! -x "$pg_bin/postgres" ]]; then
  if command -v pg_ctl >/dev/null 2>&1; then
    pg_bin=$(dirname "$(command -v pg_ctl)")
  elif [[ -x /usr/lib/postgresql/17/bin/postgres ]]; then
    pg_bin=/usr/lib/postgresql/17/bin
  else
    echo 'PostgreSQL 17 binaries are missing. See tests/management/README.md.' >&2
    exit 2
  fi
fi
mkdir -p "$pg_root/socket"
if [[ ! -f "$pg_root/data/PG_VERSION" ]]; then
  share_options=()
  if [[ -d "$pg_root/root/usr/share/postgresql/17" ]]; then
    share_options=(-L "$pg_root/root/usr/share/postgresql/17")
  fi
  "$pg_bin/initdb" -D "$pg_root/data" "${share_options[@]}" --encoding=UTF8 --locale=C.UTF-8 --auth-local=trust --auth-host=trust
fi
if ! "$pg_bin/pg_ctl" -D "$pg_root/data" status >/dev/null 2>&1; then
  "$pg_bin/pg_ctl" -D "$pg_root/data" -l "$pg_root/server.log" \
    -o "-h 127.0.0.1 -p $pg_port -k $pg_root/socket -c jit=off -c max_connections=30 -c shared_buffers=32MB" start
fi
pg_user=$(id -un)
if [[ $("$pg_bin/psql" -h 127.0.0.1 -p "$pg_port" -U "$pg_user" -d postgres -Atc "SELECT 1 FROM pg_database WHERE datname='$pg_database'") != 1 ]]; then
  "$pg_bin/createdb" -h 127.0.0.1 -p "$pg_port" -U "$pg_user" "$pg_database"
fi
"$pg_bin/psql" -h 127.0.0.1 -p "$pg_port" -U "$pg_user" -d "$pg_database" -Atc 'SELECT version()'
echo 'Local synthetic PostgreSQL is ready. No external provider was provisioned.'
