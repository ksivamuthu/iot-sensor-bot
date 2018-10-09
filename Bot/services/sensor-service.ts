const CosmosClient = require("@azure/cosmos").CosmosClient;
const endpoint = process.env.CosmosEndpoint; // Add your endpoint
const masterKey = process.env.CosmosKey; // Add the masterkey of the endpoint
const client = new CosmosClient({ endpoint, auth: { masterKey } });
const databaseDefinition = { id: "sensor-data" };
const collectionDefinition = { id: "sensor-data" };

export abstract class SensorService {
  static async query(querySpec: any) {
    const db = await client.databases.createIfNotExists({
      id: databaseDefinition.id
    });
    const container = await db.ref.containers.createIfNotExists({
      id: collectionDefinition.id
    });
    const { result: results } = await container.ref.items
      .query(querySpec)
      .toArray();
    return results;
  }

  static async getTemperature(aggregationTypes: string[]) {
    var result = {};
    for (var i = 0; i <= aggregationTypes.length - 1; i++) {
      let querySpec = {
        query: "SELECT TOP 1 * FROM c ORDER BY c._ts DESC"
      };
      const aggregationType = aggregationTypes[i];

      if (aggregationType === "latest") {
        querySpec = {
          query: "SELECT TOP 1 * FROM c ORDER BY c._ts DESC"
        };
      } else if (aggregationType === "average") {
        querySpec = {
          query: "SELECT VALUE AVG(c.temperature) from c"
        };
      } else if (aggregationType === "minimum") {
        querySpec = {
          query: "SELECT TOP 1 * FROM c ORDER BY c.temperature ASC"
        };
      } else if (aggregationType === "maximum") {
        querySpec = {
          query: "SELECT TOP 1 * FROM c ORDER BY c.temperature DESC"
        };
      }

      result[aggregationType] = await this.query(querySpec);
    }
    return result;
  }
}
