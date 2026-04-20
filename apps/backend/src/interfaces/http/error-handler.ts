import type { ErrorHandler } from 'hono';

export const errorHandler: ErrorHandler = (error, context) => {
    console.error(error);

    return context.json(
        {
            error: 'Internal Server Error',
        },
        500,
    );
};
