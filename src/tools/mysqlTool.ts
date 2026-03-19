import mysql from "mysql2/promise";

export async function executeMysqlQuery(host: string, port: number, user: string, pass: string, db: string, query: string): Promise<string> {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: host,
      port: port,
      user: user,
      password: pass,
      database: db,
    });
    const [rows] = await connection.execute(query);
    if (Array.isArray(rows) && rows.length === 0) {
      return "Nenhum registro encontrado para esta consulta no banco de dados.";
    }
    return JSON.stringify(rows, null, 2);
  } catch (error: any) {
    return JSON.stringify({ error: `Falha na execução MySQL: ${error.message}` });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
