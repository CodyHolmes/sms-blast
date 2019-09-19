# SMS Blast Service

A simple SMS Blast Service using the Twilio API for sending texts.

## Environment Variables

- `MYSQL_HOST` - MySQL Hostname
- `MYSQL_USER` - MySQL Username
- `MYSQL_PASSWORD` - MySQL Password
- `MYSQL_DATABASE` - MySQL Database Name
- `INSTANCE_CONNECTION_NAME` - CGP Connection Name
- `TWILIO_ACCOUNT_SID` - Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Twilio Auth Token
- `TWILIO_NUMBER` - Twilio Number
- `TWILIO_ADMIN_NUMBERS` - Numbers that can text blast service
- `NODE_ENV`

## Database

This blast service uses MySQL to store the recipents numbers. For the DB connection use the following env variables: `MYSQL_HOST`, `MYSQL_USER` , `MYSQL_PASSWORD`, `MYSQL_DATABASE`. I personally used GCP to host my MySQL DB so setting the `NODE_ENV` to `'production'` and setting the `INSTANCE_CONNECTION_NAME` env to my GCP instance connection name will override the `MYSQL_HOST` env variable.

## Usage
1. Deploy this service
2. Change Twilio text hook to point to your service

## Local Testing / Deploying
- Use serveo.net to expose local ports to the world
    - Blast: `ssh -R sms-blast:80:localhost:3001 serveo.net`
- Use Docker to start services
    - `docker-compose up --build`
- Use Docker to ssh into containers
    - `docker exec -it <container number> /bin/bash`
- Use Google Cloud CLI to push services to functions
    - First deploy: `gcloud functions deploy <name> --runtime nodejs10 --trigger-http --entry-point <function>`
    - Subsequent deploys: `gcloud functions deploy <name> --trigger-http --entry-point <function>`
