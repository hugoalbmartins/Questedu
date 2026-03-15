/*
  # Trading System Functions

  1. Functions
    - Enhanced trade management
    - Accept/reject trades
    - Trade history
*/

-- Function to get pending trade offers
CREATE OR REPLACE FUNCTION get_pending_trades(student_id_param uuid)
RETURNS TABLE (
  trade_id uuid,
  sender_id uuid,
  sender_name text,
  receiver_id uuid,
  receiver_name text,
  sender_items jsonb,
  receiver_items jsonb,
  message text,
  created_at timestamptz,
  expires_at timestamptz,
  is_sender boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as trade_id,
    s1.id as sender_id,
    s1.name as sender_name,
    s2.id as receiver_id,
    s2.name as receiver_name,
    t.sender_items,
    t.receiver_items,
    t.message,
    t.created_at,
    t.expires_at,
    (t.sender_id = student_id_param) as is_sender
  FROM trade_offers t
  JOIN students s1 ON s1.id = t.sender_id
  JOIN students s2 ON s2.id = t.receiver_id
  WHERE (t.sender_id = student_id_param OR t.receiver_id = student_id_param)
  AND t.status = 'pending'
  AND t.expires_at > now()
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_pending_trades TO authenticated;