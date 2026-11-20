#!/bin/bash

set -euo pipefail

redis-server --dir /data --appendonly yes --notify-keyspace-events Ex --daemonize yes  --protected-mode no --bind 0.0.0.0

exec docker-entrypoint.sh mysqld