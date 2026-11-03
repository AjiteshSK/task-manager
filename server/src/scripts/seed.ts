import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { TaskModel } from '../models/task.model.js';
import { UserModel } from '../models/user.model.js';
import type { CreateTaskInput } from '../schemas/task.schema.js';
import { register } from '../services/auth.service.js';
import { deleteUser } from '../services/user.service.js';
import { logger } from '../utils/logger.js';

const DEMO_USER = { name: 'Demo User', email: 'demo@example.com', password: 'Demo@1234' };

/** A date the given number of days from now; negative numbers are in the past. */
function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

const sampleTasks: CreateTaskInput[] = [
  {
    title: 'Set up the project repository',
    description: 'Initialize git, TypeScript, ESLint and Prettier.',
    status: 'done',
    priority: 'high',
    dueDate: daysFromNow(-6),
  },
  {
    title: 'Design the database schema',
    description: 'Users and tasks, with indexes for the common queries.',
    status: 'done',
    priority: 'medium',
    dueDate: daysFromNow(-3),
  },
  {
    title: 'Review pull request feedback',
    status: 'todo',
    priority: 'low',
    dueDate: daysFromNow(-1),
  },
  {
    title: 'Build the authentication API',
    description: 'Register, login and protected routes with JWT.',
    status: 'in_progress',
    priority: 'high',
    dueDate: daysFromNow(1),
  },
  {
    title: 'Prepare the interview demo',
    description: 'Walk through the architecture and the main flows.',
    status: 'todo',
    priority: 'high',
    dueDate: daysFromNow(2),
  },
  {
    title: 'Write integration tests',
    status: 'in_progress',
    priority: 'medium',
    dueDate: daysFromNow(3),
  },
  { title: 'Plan the next sprint', status: 'todo', priority: 'medium' },
  { title: 'Update the README', status: 'todo', priority: 'low' },
];

async function seed() {
  await connectDatabase();

  // Remove the demo account from a previous run, so the script can be run any number of times
  const existing = await UserModel.findOne({ email: DEMO_USER.email });
  if (existing) {
    await deleteUser(existing._id.toString());
  }

  const { user } = await register(DEMO_USER);
  await TaskModel.insertMany(sampleTasks.map((task) => ({ ...task, userId: user._id })));

  logger.info(`Seeded ${DEMO_USER.email} / ${DEMO_USER.password} with ${sampleTasks.length} tasks`);
}

try {
  await seed();
} finally {
  await disconnectDatabase();
}
