const responseStrings = require('./responseStrings');

const config = {
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
};

if (
  process.env.INSTANCE_CONNECTION_NAME &&
  process.env.NODE_ENV === 'production'
) {
  config.socketPath = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;
} else {
  config.host = process.env.MYSQL_HOST;
}

const knex = require('knex')({
  client: 'mysql',
  connection: config,
  pool: { min: 0, max: 10 }
});

const getCustomers = async () => {
  const customers = await knex('Customer').select();
  return customers;
};

const addCustomer = async (name, phone) => {
  return knex('Customer')
    .select()
    .where('Phone', phone)
    .then(function(rows) {
      if (rows.length === 0) {
        // no matching records found, insert customer
        return knex('Customer')
          .insert({ Name: name, Phone: phone })
          .then(function(row) {
            // row inserted
            return responseStrings.subscribeSuccessMessage;
          })
          .catch(function(err) {
            console.error(err);
            return responseStrings.subscribeFailMessage;
          });
      } else {
        // return or throw - duplicate name found
        return responseStrings.alreadySubscribed;
      }
    })
    .catch(function(err) {
      console.error(err);
      return responseStrings.subscribeFailMessage;
    });
};

const removeCustomer = async phone => {
  return knex('Customer')
    .select()
    .where('Phone', phone)
    .then(function(rows) {
      if (rows.length === 0) {
        return responseStrings.alreadyUnsubscribed;
      } else {
        return knex('Customer')
          .where('Phone', phone)
          .del()
          .then(res => {
            return responseStrings.unsubscribeSuccessMessage;
          })
          .catch(err => {
            console.error(err);
            return responseStrings.unsubscribeFailMessage;
          });
      }
    })
    .catch(function(err) {
      console.error(err);
      return responseStrings.unsubscribeFailMessage;
    });
};

module.exports = {
  getCustomers,
  addCustomer,
  removeCustomer
};
