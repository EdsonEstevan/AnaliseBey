import { Router } from 'express';

import { authenticate } from '../middleware/auth';
import {
  adminUserFiltersSchema,
  auditQuerySchema,
  partShareGrantSchema,
  partShareRevokeSchema,
  permissionGrantSchema,
  permissionRevokeSchema,
  punishmentCreateSchema,
  punishmentLiftSchema,
  roleUpdateSchema,
} from '../modules/admin/admin.schema';
import {
  applyPunishment,
  describeUser,
  grantPartShare,
  grantWorkspacePermission,
  liftPunishment,
  listAuditLogs,
  listUsers,
  resetUserPassword,
  revokePartShare,
  revokeWorkspacePermission,
  updateUserRole,
} from '../modules/admin/admin.service';

export const adminRouter = Router();

adminRouter.use(authenticate);

adminRouter.get('/users', async (req, res) => {
  const filters = adminUserFiltersSchema.partial().parse(req.query);
  const users = await listUsers(req.user!, filters);
  res.json({ users });
});

adminRouter.get('/users/:id', async (req, res) => {
  const user = await describeUser(req.user!, req.params.id);
  res.json({ user });
});

adminRouter.post('/users/:id/reset-password', async (req, res) => {
  const result = await resetUserPassword(req.user!, req.params.id);
  res.json(result);
});

adminRouter.post('/users/:id/role', async (req, res) => {
  const payload = roleUpdateSchema.parse(req.body);
  const updated = await updateUserRole(req.user!, req.params.id, payload.role, payload.reason);
  res.json({ user: updated });
});

adminRouter.post('/permissions/grant', async (req, res) => {
  const payload = permissionGrantSchema.parse(req.body);
  const permission = await grantWorkspacePermission(req.user!, payload);
  res.status(201).json({ permission });
});

adminRouter.post('/permissions/revoke', async (req, res) => {
  const payload = permissionRevokeSchema.parse(req.body);
  const permission = await revokeWorkspacePermission(req.user!, payload);
  res.json({ permission });
});

adminRouter.post('/parts/share', async (req, res) => {
  const payload = partShareGrantSchema.parse(req.body);
  const grant = await grantPartShare(req.user!, payload);
  res.status(201).json({ grant });
});

adminRouter.post('/parts/share/revoke', async (req, res) => {
  const payload = partShareRevokeSchema.parse(req.body);
  const grant = await revokePartShare(req.user!, payload);
  res.json({ grant });
});

adminRouter.post('/punishments', async (req, res) => {
  const payload = punishmentCreateSchema.parse(req.body);
  const punishment = await applyPunishment(req.user!, payload);
  res.status(201).json({ punishment });
});

adminRouter.post('/punishments/lift', async (req, res) => {
  const payload = punishmentLiftSchema.parse(req.body);
  const punishment = await liftPunishment(req.user!, payload);
  res.json({ punishment });
});

adminRouter.get('/audit', async (req, res) => {
  const filters = auditQuerySchema.parse(req.query);
  const logs = await listAuditLogs(req.user!, filters);
  res.json({ logs });
});
