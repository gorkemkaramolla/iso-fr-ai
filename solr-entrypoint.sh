#!/bin/bash

# Ensure the Solr data directory exists
mkdir -p /var/solr/data

# Start Solr in the background
solr start

# Wait for Solr to be fully up and running
sleep 20  # Increase sleep time if necessary

# Create cores if they do not already exist
if ! solr status | grep -q "logs"; then
  solr-precreate logs
fi

if ! solr status | grep -q "isoai"; then
  solr-precreate isoai
fi

# Create the core.properties file if necessary
if [ ! -f /var/solr/data/isoai/core.properties ]; then
  echo -e "name=isoai\nconfig=solrconfig.xml\nschema=schema.xml\ndataDir=data" > /var/solr/data/isoai/core.properties
fi

# Restart Solr to apply changes
exec solr restart -f
