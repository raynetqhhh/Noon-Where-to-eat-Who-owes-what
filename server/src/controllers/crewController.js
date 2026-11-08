import { canAccessCrew, CrewModel } from '../models/crewModel.js';
import { buildFairnessBoard } from '../services/insightService.js';
import { ensureProfile } from '../services/profileService.js';
import { ApiError } from '../utils/ApiError.js';
import { presentCrew } from '../views/userView.js';

async function loadCrew(req, { ownerOnly = false } = {}) {
  const crew = await CrewModel.findById(req.params.crewId);
  if (!crew || !canAccessCrew(crew, req.user.id)) throw ApiError.notFound('Crew not found');
  if (ownerOnly && crew.owner_id !== req.user.id) throw ApiError.forbidden('Only the crew owner can change this');
  return crew;
}

function crewFields({ name, budgetPerHeadCents, meetingPoint }) {
  const fields = {};
  if (name !== undefined) fields.name = name;
  if (budgetPerHeadCents !== undefined) fields.budget_per_head_cents = budgetPerHeadCents;
  if (meetingPoint !== undefined) fields.meeting_point = meetingPoint;
  return fields;
}

function memberTaken(err, name) {
  if (err.status === 409) return ApiError.conflict(`"${name}" is already in this crew`);
  return err;
}

// GET /api/crews
export async function listCrews(req, res) {
  const crews = await CrewModel.listForUser(req.user.id);
  res.json({ data: crews.map((c) => presentCrew(c, req.user.id)) });
}

// POST /api/crews   (you are added as the first member)
export async function createCrew(req, res) {
  const profile = await ensureProfile(req.user);
  const { id } = await CrewModel.create({ ownerId: req.user.id, ...req.body });
  await CrewModel.addMember({
    crewId: id,
    profileId: req.user.id,
    displayName: profile.display_name,
    dietary: profile.dietary,
  });
  const crew = await CrewModel.findById(id);
  res.status(201).json({ data: presentCrew(crew, req.user.id) });
}

// GET /api/crews/:crewId   (includes this crew's fairness board)
export async function getCrew(req, res) {
  const crew = await loadCrew(req);
  const sessions = await CrewModel.listDecidedSessions([crew.id]);
  const [board] = buildFairnessBoard(sessions, [crew]);
  res.json({ data: { ...presentCrew(crew, req.user.id), fairness: board.rows, lunchCount: sessions.length } });
}

// PATCH /api/crews/:crewId
export async function updateCrew(req, res) {
  const crew = await loadCrew(req, { ownerOnly: true });
  const fields = crewFields(req.body);
  if (Object.keys(fields).length) await CrewModel.update(crew.id, fields);
  res.json({ data: presentCrew(await CrewModel.findById(crew.id), req.user.id) });
}

// DELETE /api/crews/:crewId
export async function deleteCrew(req, res) {
  const crew = await loadCrew(req, { ownerOnly: true });
  await CrewModel.remove(crew.id);
  res.status(204).end();
}

// POST /api/crews/:crewId/members
export async function addMember(req, res) {
  const crew = await loadCrew(req, { ownerOnly: true });
  try {
    await CrewModel.addMember({ crewId: crew.id, displayName: req.body.displayName, dietary: req.body.dietary });
  } catch (err) {
    throw memberTaken(err, req.body.displayName);
  }
  res.status(201).json({ data: presentCrew(await CrewModel.findById(crew.id), req.user.id) });
}

// PATCH /api/crews/:crewId/members/:memberId
export async function updateMember(req, res) {
  const crew = await loadCrew(req, { ownerOnly: true });
  const fields = {};
  if (req.body.displayName !== undefined) fields.display_name = req.body.displayName;
  if (req.body.dietary !== undefined) fields.dietary = req.body.dietary;
  try {
    const member = await CrewModel.updateMember(crew.id, req.params.memberId, fields);
    if (!member) throw ApiError.notFound('Crew member not found');
  } catch (err) {
    throw memberTaken(err, req.body.displayName);
  }
  res.json({ data: presentCrew(await CrewModel.findById(crew.id), req.user.id) });
}

// DELETE /api/crews/:crewId/members/:memberId
export async function removeMember(req, res) {
  const crew = await loadCrew(req, { ownerOnly: true });
  await CrewModel.removeMember(crew.id, req.params.memberId);
  res.json({ data: presentCrew(await CrewModel.findById(crew.id), req.user.id) });
}
