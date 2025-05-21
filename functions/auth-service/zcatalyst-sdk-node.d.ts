declare module 'zcatalyst-sdk-node' {
  export interface App {
    datastore(): Datastore;
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

  const catalyst: {
    initialize(): App;
  };
  
  export default catalyst;
  export { catalyst };
}