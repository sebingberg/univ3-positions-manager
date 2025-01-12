/**
 * @file errorHandler.ts
 * @description Utility for standardized error handling across the application.
 */

import { logger } from './logger';

/**
 * ! Interface defining the context for error handling
 * @param operation Name of the operation being performed
 * @param params Optional parameters that were used in the operation
 * @param contractAddress Optional address of the contract being interacted with
 */
interface ErrorContext {
  operation: string;
  params?: any;
  contractAddress?: string;
}

export class LiquidityError extends Error {
  constructor(
    message: string,
    public context: ErrorContext,
    public originalError?: Error,
  ) {
    super(message);
    this.name = 'LiquidityError';
  }
}

/**
 * @dev Wraps an async operation with standardized error handling
 * @param operation The async operation to execute
 * @param context Context information for error reporting
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    // * Type assertion for error handling
    const error = err as Error;

    // * Handle contract-related errors
    if (error.message?.includes('contract')) {
      logger.error('Contract Error', {
        ...context,
        errorMessage: error.message,
      });
      throw new LiquidityError(
        `Contract error in ${context.operation}`,
        context,
        error,
      );
    }

    // * Handle network-related errors
    if (
      error.message?.includes('network') ||
      error.message?.includes('provider')
    ) {
      logger.error('Network Error', {
        ...context,
        errorMessage: error.message,
      });
      throw new LiquidityError(
        `Network error in ${context.operation}`,
        context,
        error,
      );
    }

    // * Handle unknown errors
    logger.error('Unknown Error', {
      ...context,
      error: error.message,
    });
    throw new LiquidityError(
      `Unknown error in ${context.operation}`,
      context,
      error,
    );
  }
}
