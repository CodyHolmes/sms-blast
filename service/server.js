/*
  SMS blast service to send a text to multiple people
*/
const app = require('express')();
const bodyParser = require('body-parser');
const responseStrings = require('./responseStrings');
const db = require('./db');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure necessary Twilio objects
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// List of admin phone numbers should be in the system environment
const adminNumbers = process.env.TWILIO_ADMIN_NUMBERS;

// Basic Command Class
class Command {
  constructor(event, context) {
    this.fromNumber = event.From;
    this.body = event.Body || '';
    this.event = event;
    this.context = context;
  }

  // Get an array of arguments after the first word for a command
  get commandArguments() {
    return this.body
      .trim()
      .split(' ')
      .slice(1);
  }

  // Rejoin text after the command with spaces reinserted
  get commandText() {
    return this.commandArguments.join(' ');
  }

  // Execute command -- should be overridden by subclasses
  run(callback) {
    callback(null, 'Command not implemented.');
  }
}

// Help
class HelpCommand extends Command {
  run(callback) {
    return callback(null, responseStrings.helpMessage);
  }
}

// Subscribe
class SubscribeCommand extends Command {
  run(callback) {
    db.addCustomer(null, this.fromNumber)
      .then(response => {
        callback(null, response);
      })
      .catch(err => {
        callback(err, responseStrings.subscribeFailMessage);
      });
  }
}

// Unsubscribe
class UnsubscribeCommand extends Command {
  run(callback) {
    db.removeCustomer(this.fromNumber)
      .then(response => {
        callback(null, response);
      })
      .catch(err => {
        callback(err, responseStrings.unsubscribeFailMessage);
      });
  }
}

// Broadcast
class BroadcastCommand extends Command {
  run(callback) {
    // Check if sender is in list of admins, stored in the system environment
    // as a comma-separated string
    if (adminNumbers.indexOf(this.fromNumber) < 0) {
      return callback(null, responseStrings.broadcastNotAuthorizedMessage);
    }

    const errors = [];
    db.getCustomers()
      .then(customers => {
        // Send texts to each customer
        for (let i = 0; i < customers.length; i++) {
          client.messages.create(
            {
              body: this.commandText,
              to: customers[i].Phone,
              from: process.env.TWILIO_NUMBER
            },
            (err, response) => {
              if (err) {
                console.error(err);
                errors.push(err);
              }
            }
          );
        }

        if (errors.length > 0) {
          return callback(errors, responseStrings.broadcastFailMessage);
        }
        return callback(null, responseStrings.broadcastSuccessMessage);
      })
      .catch(err => {
        return callback(err, responseStrings.broadcastFailMessage);
      });
  }
}

// Ping route for testing
app.get('/ping', (req, res) => res.status(200).send('Blast Pong'));

// Blast route
app.post('/blast', async (req, res) => {
  // Get command text from incoming SMS body
  let body = req.body;
  let cmd = body.Body || '';
  cmd = cmd
    .trim()
    .split(' ')[0]
    .toLowerCase();

  // Default to help command
  let cmdInstance = new HelpCommand(body, req);

  // Choose other commands as appropriate
  switch (cmd) {
    case 'start':
      cmdInstance = new SubscribeCommand(body, req);
      break;
    case 'broadcast':
    case 'blast':
      cmdInstance = new BroadcastCommand(body, req);
      break;
    case 'remove':
    case 'stop':
      cmdInstance = new UnsubscribeCommand(body, req);
      break;
  }

  // Execute command
  cmdInstance.run((err, message) => {
    if (err) {
      console.error(err);
      message = 'There was a problem with your request. Try again!';
    }

    client.messages.create(
      {
        to: cmdInstance.fromNumber,
        from: process.env.TWILIO_NUMBER,
        body: message
      },
      (err, response) => {
        if (err) {
          console.error(err);
          return res.status(500).send(err);
        }
        return res.status(200).send(message);
      }
    );
  });
});

app.listen(process.env.DEV_PORT || 80);

module.exports = { app };
