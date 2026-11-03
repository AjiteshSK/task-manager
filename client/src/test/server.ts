import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** Intercepts fetch calls in tests and answers them with the handlers. */
export const server = setupServer(...handlers);
