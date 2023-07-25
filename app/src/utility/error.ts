import { HttpStatusCode }    from 'axios';
import { Request, Response } from 'express';

import { logger } from './logger.js';

interface NewAppErrorOptions {
    http_code?:  number;
    is_warning?: boolean;
    is_fatal?:   boolean;
    is_wrapper?: false;
}

interface WrappedAppErrorOptions {
    http_code?:  number;
    is_warning?: boolean;
    is_fatal?:   boolean;
    is_wrapper:  true;
    original:    Error;
}

type AppErrorOptions = NewAppErrorOptions | WrappedAppErrorOptions;

interface DevelopmentErrorResponse {
    http_code: number;
    message?:  string;
    stack?:    string;
}

export class AppError<T extends AppErrorOptions> extends Error {
    constructor(message: string, public readonly options: T = { } as T) {
        super(message);
        this.name = 'AppError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

class ErrorHandler {
    lastError?: Error;

    constructor() { }

    handle(error: Error) {
        if ((error instanceof AppError) && (error.options.is_wrapper === false)) {
            error.message          = error.options.original.message;
            error.stack            = error.options.original.stack;
            error.options.original = error.options.original.original;
        }

        if (process.exitCode === 0) {
            this.lastError = error;

            try {
                if ((error instanceof AppError) && (error.options.is_warning)) {
                    logger.warn(error.message);
                } else {
                    logger.error(error.message);
                }
                if ((error instanceof Error) && (error.stack !== undefined)) {
                    logger.debug(error.stack);
                }

                if ((error instanceof AppError) && (error.options.is_wrapper === true)) {
                    logger.debug(`Reason: ${error.options.original.message}`);
                    if (error.options.original.stack !== undefined) {
                        logger.debug(error.options.original.stack);
                    }
                }
            } finally {
                if (!(error instanceof AppError) || (error.options.is_fatal === true)) {
                    logger.end();
                    process.exitCode = 1;
                }
            }
        }
    }

    errorResponse(request: Request, response: Response) {
        let status: number;
        if ((this.lastError instanceof AppError) && (this.lastError.options.http_code !== undefined)) {
            status = this.lastError.options.http_code;
        } else {
            status = HttpStatusCode.InternalServerError;
        }

        response.status(status);

        const content: DevelopmentErrorResponse = {
            http_code: status,
        };

        if ((this.lastError instanceof Error) && (process.env.NODE_ENV === 'development')) {
            content.message = this.lastError.message;
            if (this.lastError.stack !== undefined) {
                content.stack = this.lastError.stack;
            }
        }

        response.json(content);
    }
}

export const error_handler = new ErrorHandler();
