# todos-express-social

This app illustrates how to use [Passport](https://www.passportjs.org/) with
[Express](https://expressjs.com/) to sign users in with [Google](https://www.google.com/),
[Facebook](https://www.facebook.com), and [Twitter](https://twitter.com).  Use
this example as a starting point for your own web applications.

## Quick Start

To run this app, clone the repository and install dependencies:

```bash
$ git clone https://github.com/passport/todos-express-social.git
$ cd todos-express-social
$ npm install
```

This app requires credentials from Google, Facebook, and Twitter.

Once credentials have been obtained, create a `.env` file and add the following
environment variables:

```
GOOGLE_CLIENT_ID=__INSERT_GOOGLE_CLIENT_ID_HERE__
GOOGLE_CLIENT_SECRET=__INSERT_GOOGLE_CLIENT_SECRET_HERE__
FACEBOOK_CLIENT_ID=__INSERT_FACEBOOK_APP_ID_HERE__
FACEBOOK_CLIENT_SECRET=__INSERT_FACEBOOK_APP_SECRET_HERE__
TWITTER_CONSUMER_KEY=__INSERT_TWITTER_API_KEY_HERE__
TWITTER_CONSUMER_SECRET=__INSERT_TWITTER_API_SECRET_KEY_HERE__
```

Start the server.

```bash
$ npm start
```

Navigate to [`http://localhost:3000`](http://localhost:3000).

## License

[The Unlicense](https://opensource.org/licenses/unlicense)

## Credit

Created by [Jared Hanson](https://www.jaredhanson.me/)
