import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'unit-test-secret';

const { userRegister, userLogin } = await import('../controllers/user_controller.js');
const { createDebate, getAllDebates } = await import('../controllers/debate_controller.js');
const { addArgument } = await import('../controllers/argument_controller.js');
const { default: authMiddleware } = await import('../middleware/auth.js');
const { default: debateModel } = await import('../models/debate.js');

function mockResponse() {
    return {
        statusCode: undefined,
        payload: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.payload = body;
            return this;
        }
    };
}

test('userRegister returns 400 when required fields are missing', async () => {
    const res = mockResponse();

    await userRegister({ body: { username: 'Alice', email: 'alice@example.com' } }, res);

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({ message: 'All fields are required' });
});

test('userLogin returns 400 when credentials are missing', async () => {
    const res = mockResponse();

    await userLogin({ body: { email: 'alice@example.com' } }, res);

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({ message: 'All fields are required' });
});

test('createDebate returns 400 when title or description is missing', async () => {
    const res = mockResponse();

    await createDebate({ body: { title: 'A debate' }, user: { userId: 'user-1' } }, res);

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({ message: 'Title and description are required' });
});

test('getAllDebates returns 400 when status filter is invalid', async () => {
    const res = mockResponse();

    await getAllDebates({ query: { status: 'draft' } }, res);

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({ message: "Status must be either 'OPEN' or 'CLOSED'" });
});

test('debate model includes feature defaults for category, status, likes, and views', () => {
    const debate = new debateModel({
        title: 'A debate',
        description: 'A useful discussion',
        creator: new mongoose.Types.ObjectId()
    });

    expect(debate.category).toBe('General');
    expect(debate.status).toBe('OPEN');
    expect(debate.likes).toEqual([]);
    expect(debate.views).toBe(0);
});

test('addArgument returns 400 when required fields are missing', async () => {
    const res = mockResponse();

    await addArgument({ body: { content: 'I agree', side: 'FOR' }, user: { userId: 'user-1' } }, res);

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({ message: 'Content, side, and debateId are required' });
});

test('addArgument returns 400 when side is invalid', async () => {
    const res = mockResponse();

    await addArgument({
        body: { content: 'I agree', side: 'MAYBE', debateId: 'debate-1' },
        user: { userId: 'user-1' }
    }, res);

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({ message: "Side must be either 'FOR' or 'AGAINST'" });
});

test('authMiddleware returns 401 when no bearer token is provided', () => {
    const res = mockResponse();
    let nextCalled = false;

    authMiddleware({ headers: {} }, res, () => {
        nextCalled = true;
    });

    expect(res.statusCode).toBe(401);
    expect(res.payload).toEqual({ message: 'No token provided, authorization denied' });
    expect(nextCalled).toBe(false);
});

test('authMiddleware returns 401 when token is invalid', () => {
    const res = mockResponse();
    let nextCalled = false;

    authMiddleware({ headers: { authorization: 'Bearer invalid-token' } }, res, () => {
        nextCalled = true;
    });

    expect(res.statusCode).toBe(401);
    expect(res.payload).toEqual({ message: 'Token is not valid' });
    expect(nextCalled).toBe(false);
});

test('authMiddleware attaches decoded user and calls next for a valid token', () => {
    const req = {
        headers: {
            authorization: `Bearer ${jwt.sign({ userId: 'user-1' }, process.env.JWT_SECRET)}`
        }
    };
    const res = mockResponse();
    let nextCalled = false;

    authMiddleware(req, res, () => {
        nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(req.user.userId).toBe('user-1');
    expect(res.statusCode).toBeUndefined();
});
