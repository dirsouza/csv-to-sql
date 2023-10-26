#!/bin/bash

# MySQL
MYSQL_USER="root"
MYSQL_PASSWORD="root"
MYSQL_DATABASE="best-spaces"

# Folder with SQL scripts
FOLDER_SCRIPTS="./sql/output"

for script in "$FOLDER_SCRIPTS"/*; do
  if [ -f "$script" ]; then
    echo "Processing the SQL script: $(basename "$script")"
    docker exec -i mysql mysql -u$MYSQL_USER -p$MYSQL_PASSWORD --default-character-set=utf8mb4 -D $MYSQL_DATABASE <$script
  fi
done
