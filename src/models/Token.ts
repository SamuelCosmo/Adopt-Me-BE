export interface UserProps {
  id: number
  user_id: number
  token: string
  type: 'refresh_token' | 'access_token' | 'password_reset'
  is_revoked: boolean
  expires_at: string
  created_at: string
  updated_at: string
}
