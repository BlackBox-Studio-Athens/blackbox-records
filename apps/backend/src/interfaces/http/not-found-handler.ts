import type { NotFoundHandler } from 'hono';

export const notFoundHandler: NotFoundHandler = (context) => {
    return context.json(
        {
            error: 'Not Found',
        },
        404,
    );
};
