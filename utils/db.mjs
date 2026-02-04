// Create PostgreSQL Connection Pool here !
import pkg from "pg";
const { Pool } = pkg;

const connectionPool = new Pool({
  connectionString:
    "postgresql://postgres:Thanapol10@localhost:5432/backend-skill-checkpoint",
});

export default connectionPool;