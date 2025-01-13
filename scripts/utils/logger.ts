/**
 * @file logger.ts
 * @description Centralized logging utility for the application.
 * Provides functionality to:
 * - Log operations with different severity levels
 * - Track blockchain transactions
 * - Maintain a history of operations
 * - Format and store operation details
 *
 * @example
 * ```typescript
 * logger.info('Operation Started', { param1: 'value1' })
 * await logger.logTransaction('Operation Complete', receipt, details)
 * ```
 *
 * ! Important: All blockchain operations should be logged
 * * Note: Logs are stored in memory and printed to console
 */

import { TransactionReceipt } from 'ethers';

/**
 * * Supported log levels for operations
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * ! Interface defining the structure of a log entry
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  operation: string;
  details: Record<string, unknown>;
  txHash?: string;
}

/**
 * @class Logger
 * @description Handles all logging operations in the application
 */
class Logger {
  private logs: LogEntry[] = [];

  /**
   * @dev Creates a new log entry with the specified level and details
   * @param level Severity level of the log
   * @param operation Name of the operation being logged
   * @param details Additional information about the operation
   * @param txHash Optional transaction hash for blockchain operations
   */
  log(
    level: LogLevel,
    operation: string,
    details: Record<string, unknown>,
    txHash?: string,
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      operation,
      details,
      ...(txHash && { txHash }),
    };

    this.logs.push(entry);

    // Console output for development
    console.log(`[${entry.timestamp}] ${level.toUpperCase()}: ${operation}`);
    if (txHash) console.log(`Transaction: ${txHash}`);
    console.log('Details:', details);
  }

  debug(operation: string, details: Record<string, unknown>): void {
    this.log('debug', operation, details);
  }

  info(operation: string, details: Record<string, unknown>): void {
    this.log('info', operation, details);
  }

  warn(operation: string, details: Record<string, unknown>): void {
    this.log('warn', operation, details);
  }

  error(operation: string, details: Record<string, unknown>): void {
    this.log('error', operation, details);
  }

  async logTransaction(
    operation: string,
    receipt: TransactionReceipt,
    details: Record<string, unknown>,
  ): Promise<void> {
    this.log('info', operation, details, receipt.hash);
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }
}

export const logger = new Logger();
