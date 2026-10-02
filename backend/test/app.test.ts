import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('application shell', () => {
  it('reports liveness without requiring the database', async () => {
    const response = await request(app).get('/api/v1/health/live');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, status: 'alive' });
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-request-id']).toBeTypeOf('string');
  });

  it('reports readiness separately from liveness', async () => {
    const response = await request(app).get('/api/v1/health/ready');

    expect(response.status).toBe(503);
    expect((response.body as { status: unknown }).status).toBe('not_ready');
  });

  it('returns a stable JSON error contract for unknown routes', async () => {
    const response = await request(app).get('/missing');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false, code: 'ROUTE_NOT_FOUND' });
  });

  it('rejects invalid login input before hitting the database', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'x', password: 'short' });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
  });

  it('requires admin authentication to change the public theme', async () => {
    const response = await request(app).put('/api/v1/admin/site/theme').send({ theme: 'light' });
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, code: 'AUTHENTICATION_REQUIRED' });
  });

  it('requires admin authentication to assign or delete leads and inquiries', async () => {
    const id = '507f1f77bcf86cd799439011';
    for (const path of [`/api/v1/inquiries/leads/${id}`, `/api/v1/inquiries/all/${id}`]) {
      const assignment = await request(app)
        .patch(`${path}/assignment`)
        .send({ assignment_status: 'assigned' });
      const deletion = await request(app).delete(path);
      expect(assignment.status).toBe(401);
      expect(deletion.status).toBe(401);
    }
  });
});
