# Derived from official mysql image (our base image)
FROM mysql:8.0.17

# Add the content of the sql-scripts/ directory to your image
# All scripts in docker-entrypoint-initdb.d/ are automatically
# executed during container startup
COPY ./sql-scripts/set-up.sql /docker-entrypoint-initdb.d/