'use strict';

/**
 * 400 (Bad Request) Handler
 *
 * Usage:
 * return res.badRequest();
 * return res.badRequest(data);
 * return res.badRequest(data, 'some/specific/badRequest/view');
 *
 * e.g.:
 * ```
 * return res.badRequest(
 *   'Please choose a valid `password` (6-12 characters)',
 *   'trial/signup'
 * );
 * ```
 */

const badRequestCode = 400;

module.exports = function badRequest (data, options) {
  var req = this.req;
  var res = this.res;
  var sails = req._sails;

  options = options || {};

  res.status(badRequestCode);

  if (data === undefined) {
    sails.log.verbose('Sending 400 ("Bad Request") response');
  } else {
    sails.log.verbose('Sending 400 ("Bad Request") response: \n', data);
  }

  // Only include errors in response if application environment
  // is not set to 'production'.  In production, we shouldn't
  // send back any identifying information about errors.
  if (sails.config.environment === 'production') {
    data = undefined;
  }

  // If the user-agent wants JSON, always respond with JSON
  if (req.wantsJSON) {
    return res.jsonx(data);
  }

  // If second argument is a string, we take that to mean it refers to a view.
  // If it was omitted, use an empty object (`{}`)
  if (typeof options === 'string') {
    options = {view: options};
  }

  // If a view was provided in options, serve it.
  // Otherwise try to guess an appropriate view, or if that doesn't
  // work, just send JSON.
  if (options.view) {
    return res.view(options.view, {data: data});
  }
  // If no second argument provided, try to serve the implied view,
  // but fall back to sending JSON(P) if no view can be inferred.
  return res.guessView({data: data}, () => res.jsonx(data));
};

