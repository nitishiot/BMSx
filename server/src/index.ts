import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { producerApplicationsRouter } from './routes/producerApplications';
import { festivalsRouter } from './routes/festivals';
import { adminRouter } from './routes/admin';
import { adminAuthRouter } from './routes/adminAuth';
import { catalogueRouter } from './routes/catalogue';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/producer-applications', producerApplicationsRouter);
app.use('/api/festivals', festivalsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin-auth', adminAuthRouter);
app.use('/api/catalogue', catalogueRouter);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`TAG core-ticketing backend (Phase 1 slice) listening on :${port}`);
});
