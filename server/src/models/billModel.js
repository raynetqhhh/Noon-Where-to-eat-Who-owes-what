import { supabase } from '../config/supabase.js';
import { unwrap } from '../utils/supabaseResult.js';

const BILL_SELECT = `
  *,
  items:bill_items!bill_items_bill_id_fkey (
    id, name, amount_cents, position,
    shares:bill_item_shares!bill_item_shares_item_id_fkey ( participant_id )
  ),
  payers:bill_payers!bill_payers_bill_id_fkey ( participant_id, amount_cents ),
  shares:bill_shares!bill_shares_bill_id_fkey ( participant_id, owed_cents ),
  settlements:settlements!settlements_bill_id_fkey (
    id, from_participant_id, to_participant_id, amount_cents, is_paid, paid_at
  )
`;

export const BillModel = {
  async findBySessionId(sessionId) {
    return unwrap(await supabase.from('bills').select(BILL_SELECT).eq('session_id', sessionId).maybeSingle());
  },

  // Atomic: runs the replace_bill() Postgres function (see supabase/migrations).
  async replace(sessionId, payload) {
    return unwrap(await supabase.rpc('replace_bill', { p_session_id: sessionId, p_bill: payload }));
  },

  async updateSettlement(settlementId, isPaid) {
    return unwrap(
      await supabase
        .from('settlements')
        .update({ is_paid: isPaid, paid_at: isPaid ? new Date().toISOString() : null })
        .eq('id', settlementId)
        .select()
        .single()
    );
  },

  async countUnpaidSettlements(billId) {
    const { count, error } = await supabase
      .from('settlements')
      .select('id', { count: 'exact', head: true })
      .eq('bill_id', billId)
      .eq('is_paid', false);
    unwrap({ data: null, error });
    return count ?? 0;
  },
};
