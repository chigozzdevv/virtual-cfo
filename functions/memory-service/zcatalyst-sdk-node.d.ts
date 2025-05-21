declare module 'zcatalyst-sdk-node' {
  // Export the interface types
  export interface CatalystApp {
    datastore(): Datastore;
    // Add other methods as needed
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
  
  // Export the initialize function
  export function initialize(req: any, options?: { scope?: 'admin' | 'user' }): CatalystApp;
}