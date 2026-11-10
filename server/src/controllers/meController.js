import { CrewModel } from '../models/crewModel.js';
import { HistoryModel } from '../models/historyModel.js';
import { ProfileModel } from '../models/profileModel.js';
import { buildFairnessBoard, buildInsights, buildLedger } from '../services/insightService.js';
import { removeAvatar, storeAvatar } from '../services/avatarService.js';
import { ensureProfile } from '../services/profileService.js';
import { presentLunch, presentProfile, presentSettlement } from '../views/userView.js';

// Everything here requires a signed-in user (see routes/index.js).

// GET /api/me
export async function getMe(req, res) {
  const profile = await ensureProfile(req.user);
  res.json({ data: presentProfile(profile, req.user) });
}

// PATCH /api/me
export async function updateMe(req, res) {
  await ensureProfile(req.user);
  const columns = {
    displayName: 'display_name',
    dietary: 'dietary',
    allergies: 'allergies',
    paynowId: 'paynow_id',
    tagline: 'tagline',
    favouriteCuisines: 'favourite_cuisines',
    favouriteFoods: 'favourite_foods',
    spiceLevel: 'spice_level',
  };
  const fields = {};
  for (const [key, column] of Object.entries(columns)) {
    if (req.body[key] !== undefined) fields[column] = req.body[key];
  }

  const profile = Object.keys(fields).length
    ? await ProfileModel.update(req.user.id, fields)
    : await ProfileModel.findById(req.user.id);
  res.json({ data: presentProfile(profile, req.user) });
}

// PUT /api/me/avatar   (raw image body, resized in the browser first)
export async function uploadAvatar(req, res) {
  await ensureProfile(req.user);
  const avatarUrl = await storeAvatar(req.user.id, req.body);
  const profile = await ProfileModel.update(req.user.id, { avatar_url: avatarUrl });
  res.json({ data: presentProfile(profile, req.user) });
}

// DELETE /api/me/avatar
export async function deleteAvatar(req, res) {
  await ensureProfile(req.user);
  await removeAvatar(req.user.id);
  const profile = await ProfileModel.update(req.user.id, { avatar_url: null });
  res.json({ data: presentProfile(profile, req.user) });
}

// GET /api/me/lunches   (meal history)
export async function listLunches(req, res) {
  const rows = await HistoryModel.listParticipations(req.user.id);
  res.json({ data: rows.filter((r) => r.session).map(presentLunch) });
}

// GET /api/me/payments   (payment records + netted ledger)
export async function listPayments(req, res) {
  const rows = await HistoryModel.listParticipations(req.user.id);
  const myIds = new Set(rows.map((r) => r.id));
  const settlements = await HistoryModel.listSettlements([...myIds]);

  const records = settlements.map((s) => presentSettlement(s, myIds));
  const open = records.filter((r) => !r.isPaid);
  res.json({
    data: {
      summary: {
        owedToYouCents: open.filter((r) => r.direction === 'owed_to_you').reduce((sum, r) => sum + r.amountCents, 0),
        youOweCents: open.filter((r) => r.direction === 'you_owe').reduce((sum, r) => sum + r.amountCents, 0),
      },
      ledger: buildLedger(settlements, myIds),
      records,
    },
  });
}

// GET /api/me/insights
export async function getInsights(req, res) {
  const [rows, crews] = await Promise.all([
    HistoryModel.listParticipations(req.user.id),
    CrewModel.listForUser(req.user.id),
  ]);
  const crewSessions = await CrewModel.listDecidedSessions(crews.map((c) => c.id));
  res.json({
    data: {
      ...buildInsights(rows),
      fairness: buildFairnessBoard(crewSessions, crews),
    },
  });
}
