const { logger } = require('firebase-functions');

/**
 * Retry an asynchronous operation with exponential backoff
 *
 * @param {Function} operation - Async function returning a Promise
 * @param {Object} options
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts
 * @param {number} [options.initialDelayMs=500] - Initial delay in milliseconds
 * @param {number} [options.backoffFactor=2] - Multiplier applied on each retry failure
 * @param {string} [options.operationName='operation'] - Name used in logs
 * @returns {Promise<any>}
 */
async function withRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    initialDelayMs = 500,
    backoffFactor = 2,
    operationName = 'operation',
  } = options;

  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      attempt++;
      return await operation();
    } catch (error) {
      if (attempt >= maxRetries) {
        logger.error(`[Retry] ${operationName} failed permanently after ${attempt} attempts:`, error);
        throw error;
      }
      logger.warn(
        `[Retry] ${operationName} attempt ${attempt} failed: ${error?.message || error}. Retrying in ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= backoffFactor;
    }
  }
}

module.exports = {
  withRetry,
};
