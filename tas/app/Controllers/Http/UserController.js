'use strict';
const Exception = use('App/Exceptions/Handler');
const User = use('App/Models/User');
const Logger = use('Logger');
const validator = require('validator');

class UserController {
  /*
    Validates that user credentials are valid then creates a new user and returns a  token
  */
  async signup({ request, auth, response, session }) {
    const password_options = {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      returnScore: false,
    };

    // Check if the creds meet our requirements, if they don't throw an error
    try {
      if (!validator.isEmail(request.input('email'))) {
        throw 'InvalidEmail';
      }
      if (
        !validator.isStrongPassword(request.input('password'), password_options)
      ) {
        throw 'InvalidPassword';
      }
      if (await User.findBy('email', request.input('email'))) {
        throw 'EmailExists';
      }
      if (request.input('password') != request.input('confirmPassword')) {
        throw 'PasswordDoesNotMatch';
      }
    } catch (error) {
      if (error == 'InvalidPassword') {
        const message =
          'Password needs to be at least 8 characters and contain one lowercase, uppercase, number and symbol.';
        session.withErrors(message).flash({ InvalidPassword: message });
        console.log('InvalidPassword');
      } else if (error == 'InvalidEmail') {
        const message = 'Please use a valid email address.';
        session.withErrors(message).flash({ InvalidEmail: message });
        console.log('InvalidEmail');
      } else if (error == 'EmailExists') {
        const message =
          'Account with this email already exists, please sign in.';
        session.withErrors(message).flash({ EmailExists: message });
        console.log('EmailExists');
      } else if (error == 'PasswordDoesNotMatch') {
        const message = 'Passwords do not match.';
        session.withErrors(message).flash({ PasswordDoesNotMatch: message });
        console.log('PasswordDoesNotMatch');
      }
      //generic error page for exceptions not handled by above
      else {
        Logger.error(error);
        throw new Exception();
      }
      return response.redirect('back');
    }

    // If all the above have passed then lets create the user and return their token
    try {
      const userData = request.only(['username', 'email', 'password']);
      const newUser = await User.create(userData);
      await auth.login(newUser);
      return response.redirect('/', true);
    } catch (error) {
      Logger.error(error);
      return response.status(400).json({
        status: 'error',
        message:
          'There was a problem creating the user, please try again later.',
      });
    }
  }

  /*
    Logs in a user and returns a session token
  */
  async login({ request, auth, response, session }) {
    try {
      await auth.attempt(request.input('email'), request.input('password'));
      return response.route('/', true);
    } catch (error) {
      console.log(error);
      const message = 'Invalid username or password!';
      console.log(message);
      session.withErrors(message).flash({ IncorrectDetails: message });
      console.log('InvalidPassword');
      Logger.error(error);
      return response.redirect('back');
    }
  }

  /*
    Logs Out User
  */
  async signout({ auth, response }) {
    try {
      await auth.logout();
      return response.route('/', true);
    } catch (error) {
      Logger.error(error);
      response.send('Error Logging Out');
    }
  }
}

module.exports = UserController;
