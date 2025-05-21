declare module 'zcatalyst-sdk-node' {
  export function initialize(req: any, options?: { scope?: 'admin' | 'user' }): App;
  
  export interface App {
    datastore(): Datastore;
    // Add other Catalyst App methods you use
  }
  
  export interface Datastore {
    table(tableName: string): Table;
  }
  
  export interface Table {
    query(query: string): Promise<{ rows: any[] }>;
    insertRow(data: any): Promise<any>;
    updateRow(data: any): Promise<any>;
    deleteRow(rowId: string | number): Promise<any>;
  }
}