import bcrypt from 'bcrypt'
const saltRounds = 10

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  const pass = await bcrypt.hash(password, saltRounds)
  return pass
}

// Verify a password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
