#!/usr/bin/env bash
host="$1"
shift
cmd="$@"
until nc -z "$host" 24224; do
  echo "Waiting for $host to be ready..."
  sleep 1
done
exec $cmd
