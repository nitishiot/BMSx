import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { producerApplicationsRouter } from './routes/producerApplications';
import { festivalsRouter } from './routes/festivals';
import { adminRouter } from './routes/admin';
import { adminAuthRouter } from './routes/adminAuth';
import { catalogueRouter } from './routes/catalogue';
import { inventoryRouter } from './routes/inventory';
import { ordersRouter } from './routes/orders';
import { surveyRouter } from './routes/survey';
import { accountRouter } from './routes/account';
import { internalOpsRouter } from './routes/internalOps';
import { authRouter } from './routes/auth';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/producer-applications', producerApplicationsRouter);
app.use('/api/festivals', festivalsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin-auth', adminAuthRouter);
app.use('/api/catalogue', catalogueRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/survey', surveyRouter);
app.use('/api/account', accountRouter);
app.use('/api/internal-ops', internalOpsRouter);
app.use('/api/auth', authRouter);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`TAG core-ticketing backend (Phase 1 slice) listening on :${port}`);
});
