import { Database } from "sqlite3";

export type ColumnDef = {
  name: string,
  type: "OBJECT" | "ARRAY" | "INTEGER" | "BOOLEAN" | "TEXT"
  index?: boolean,
  unique?: boolean,
  primary?: boolean,
  references?: { table: string, column: string },
}

export type ColumnDefLookup = {
 [key: string]: ColumnDef[]
}

type WhereCondition = {
  notOneOf?: string[] | number[],
  oneOfNoCase?: string[],
  oneOf?: string[] | number[],
  equal?: string | number | boolean,
  includes?: string,
  lessThan?: string | number,
  greaterThan?: string | number,
  caseSensitive?: boolean,
};

export type Where = number | ({
  [key: string]: string | number | boolean | null | WhereCondition
}) | Where[]

export type Pagination = number | {
  page: number,
  size: number,
} | { offset: number, size: number }

export type Select = string | string[] | { except: string | string[] }

export type Sort = {
  sortBy?: string,
  sortDirection?: 'asc' | 'desc' // defaults to 'asc'
}

export type SqlLiteQueryOptions =  { where?: Where, sort?: Sort, pagination?: Pagination, select?: Select };

export const isBooleanColumn = (columnDefs: ColumnDefLookup, table: string, column: string)  => {
  return getBooleanColumns(columnDefs, table).includes(column);
}

export const isObjectColumn  = (columnDefs: ColumnDefLookup, table: string, column: string)  => {
  return getObjColumns(columnDefs, table).includes(column);
}

export const getObjColumns = (columnDefs: ColumnDefLookup, table: string) => {
  return  columnDefs[table].filter(d => {
    return (["array", "object"]).includes(d.type.toLowerCase())
  }).map(d => d.name);
}

export const getBooleanColumns = (columnDefs: ColumnDefLookup, table: string) => {
  return  columnDefs[table].filter(d => {
    return (["bool", "boolean"]).includes(d.type.toLowerCase())
  }).map(d => d.name);
}

export type ImportTableOptions<T> = {
  batchSize?: number,
  onBeforeInsert?: (record: T & { id: number }) => T,
  onStart?: (records: number) => void,
  onSucceeded?: (opts: { oldRecord: T & { id: number }, newRecord: T & { id: number } }) => void,
  onFailed?: (record: T & { id: number }, error?: string) => void, 
}

export async function initTables(db: Database, columnDefs: ColumnDefLookup) {
  const order = computeTableOrder(columnDefs);
  for(let i = 0; i < order.length; i++) {
    await createTable(db, columnDefs, order[i])
  }
}

// returns the order in which tables should be created based on their table reference dependencies
export function computeTableOrder(columnDefs: ColumnDefLookup): string[] {
  const tableGraph: { [key: string]: string[] } = {};
  const indegree: { [key: string]: number } = {};

  // Initialize the graph and indegree count
  for (const table in columnDefs) {
    tableGraph[table] = [];
    indegree[table] = 0;
  }

  // Build the graph and compute the indegree of each node
  for (const table in columnDefs) {
    for (const column of columnDefs[table]) {
      if (column.references) {
        tableGraph[column.references.table].push(table);
        indegree[table]++;
      }
    }
  }

  // Perform topological sorting using Kahn's algorithm
  const queue: string[] = [];
  for (const table in indegree) {
    if (indegree[table] === 0) {
      queue.push(table);
    }
  }

  const sortedTables: string[] = [];
  while (queue.length > 0) {
    const table = queue.shift()!;
    sortedTables.push(table);

    for (const dependentTable of tableGraph[table]) {
      indegree[dependentTable]--;
      if (indegree[dependentTable] === 0) {
        queue.push(dependentTable);
      }
    }
  }

  if (sortedTables.length !== Object.keys(columnDefs).length) {
    throw new Error('Circular dependency detected in table definitions');
  }

  return sortedTables;
}

export async function importTable<T extends { id?: number }>(fromDb: Database, toDb: Database, columnDefs: ColumnDefLookup, table: string , options?: ImportTableOptions<T>) {
  const batchSize = options?.batchSize || 500;
  const count = await countRows(fromDb, columnDefs, table);
  options?.onStart?.(count);

  let page = 0;
  while (page * batchSize < count) {
    const rows = await queryRows(fromDb, columnDefs, table, {
      pagination: {
        size: batchSize,
        page,
      }
    });

    for (let i = 0; i < rows.length; i++) {
      const oldRecord = rows[i];
      const oldId = oldRecord.id;
      try {
        const recordToInsert = options?.onBeforeInsert?.({ ...oldRecord }) || { ...oldRecord };
        delete recordToInsert.id;
        const newRecord = await insertOne<T>(toDb, table, recordToInsert);
        options?.onSucceeded?.({ oldRecord, newRecord });
      } catch (err: any) {
        oldRecord.id = oldId;
        options?.onFailed?.(oldRecord, err.message);
      }
    }
    page++;
  }
}

export function generateUpdateSQL(columnDefs: ColumnDefLookup, table: string, id: number | string, data: Record<string, any>) {
  const keys = Object.keys(data).filter(k => k !== "id");
  const values = keys.map(key => {
    if (data[key] && typeof data[key] === "object") {
      if(!isObjectColumn(columnDefs, table, key)) {
        throw new Error(`Expected non object value for table: ${table} column: ${key}`)
      }
      return JSON.stringify(data[key]);
    } else {
      return data[key];
    }
  });
  const updateAssignments = keys.map(key => `${key} = ?`).join(', ');
  const sql = `UPDATE ${table} SET ${updateAssignments} WHERE id = ?`;
  values.push(id);
  return { sql, values };
}

export function generateInsertSQL(table: string, data: Record<string, any>) {
  const keys = Object.keys(data);
  const columns = keys.join(', ');
  const placeholders = keys.map(() => '?').join(', ');
  const values = keys.map(key => {
    if (data[key] && typeof data[key] === "object") {
      return JSON.stringify(data[key]);
    } else {
      return data[key];
    }
  });
  const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
  return { sql, values };
}

export function updateOne(db: Database, columnDefs: ColumnDefLookup, table: string, id: number | string, update: Record<string, any>) : Promise<boolean> {
  const updateWithOnlyCols = {};
  columnDefs[table].forEach(v => {
    if(v.name in update) {
      updateWithOnlyCols[v.name] = update[v.name];
    }
  })
  
  const { sql, values } = generateUpdateSQL(columnDefs, table, id, updateWithOnlyCols);
  return new Promise((resolve, reject) => {
    db.run(sql, values, function (err) {
      if (err) {
        console.error(`Failed to update row with id: ${id} from ${table}...`, err);
        reject(err);
      } else {
        resolve(true);
      }
    });
  })
}

function generateSelectClause(columnDefs: ColumnDefLookup, tableName: string, select?: Select): string {
  if (typeof select === 'string') {
    return select;
  } else if (Array.isArray(select)) {
    return select.join(', ');
  } else if (typeof select === 'object' && select.except) {
    if(!tableName || !(tableName in columnDefs)) {
      throw new Error(`Table name must be defined in columnDefs to use except.`)
    }
    const allColumns = columnDefs[tableName].map(col => col.name);
    const exceptColumns = Array.isArray(select.except) ? select.except : [select.except];
    const columnsToSelect = allColumns.filter(col => !exceptColumns.includes(col));
    return columnsToSelect.join(', ');
  } else {
    return '*';
  }
}

export function generateWhereClause(where?: Where, usePlaceholders=true): { conditions: string, values: any[] } {
  if (!where) { 
    return { conditions: '', values: [] };
  }
  
  if (typeof where === "number") {
    return generateWhereClause({ id: where, }, usePlaceholders);
  }

  if (Array.isArray(where)) {
    const allConditions : any[] = [];
    const allValues : any[] = [];

    where.forEach(nextWhere => {
      const { conditions, values } = generateWhereClause(nextWhere, usePlaceholders);
      allConditions.push(`(${conditions})`);
      allValues.push(...values);
    });

    return {
      conditions: allConditions.length ? `${allConditions.join(' OR ')}` : '',
      values: allValues,
    };
  } else {
    const { conditions, values } = generateSingleWhereClause(where, usePlaceholders);
    return {
      conditions: `${conditions}`,
      values: values,
    };
  }
}

function generateSingleWhereClause(where: Where, usePlaceholders=true): { conditions: string, values: any[] } {
  if (typeof where === "number") {
    return generateSingleWhereClause({ id: where });
  }

  if(Array.isArray(where)) {
    throw new Error(`Should not call generateSingleWhere clause if array.`)
  }

  const keys = Object.keys(where);
  const conditions : any[] = [];
  const values : any[] = [];

  keys.forEach((key: string) => {
    const value = where[key];
    if(Array.isArray(value)) {
      const allConditions : any[] = [];
      const allValues : any[] = [];
  
      value.forEach(singleWhere => {
        const { conditions, values } = generateSingleWhereClause(singleWhere, usePlaceholders);
        allConditions.push(`(${conditions})`);
        allValues.push(...values);
      });

      if(allConditions.length) {
        conditions.push(`${allConditions.join(' OR ')}`);
        values.push(...allValues);
      }
      return;
    }
    
    const makeVString = (v: any) => {
      if(usePlaceholders) {
        return '?'
      }
      if(typeof v === "number") {
        return v;
      } else {
        return `'${v}'`
      }
    }

    if (typeof value === 'object' && value !== null) {
      if (value.equal !== undefined) {
        conditions.push(`${key} = ${makeVString(value.equal)}`);
        usePlaceholders && values.push(value.equal);
      }
      if (value.includes !== undefined) {
        conditions.push(`${key} LIKE ${makeVString(value)}`);
        usePlaceholders &&  values.push(`%${value.includes}%`);
      }
      if (value.lessThan !== undefined) {
        conditions.push(`${key} < ${makeVString(value)}`);
        usePlaceholders &&  values.push(value.lessThan);
      }
      if (value.greaterThan !== undefined) {
        conditions.push(`${key} > ${makeVString(value)}`);
        usePlaceholders &&  values.push(value.greaterThan);
      }
      if (value.oneOf) {
        const placeholders = value.oneOf.map((value) => makeVString(value)).join(', ');
        conditions.push(`${key} IN (${placeholders})`);
        usePlaceholders && values.push(...value.oneOf);
      }
      if(value.oneOfNoCase) {
       const placeholders = value.oneOfNoCase.map((value) => `${makeVString(value)} COLLATE NOCASE`).join(', ');
        conditions.push(`${key} IN (${placeholders})`);
        usePlaceholders &&  values.push(...value.oneOfNoCase);
      }
      if (value.notOneOf) {
        const placeholders = value.notOneOf.map((value) => makeVString(value)).join(', ');
        conditions.push(`${key} NOT IN (${placeholders})`);
        usePlaceholders &&  values.push(...value.notOneOf);
      }
    } else {
      if (typeof value === 'boolean') {
        conditions.push(`${key} = ${makeVString(value)}`);
        usePlaceholders && values.push(value ? 1 : 0);
      } else {
        conditions.push(`${key} = ${makeVString(value)}`);
        usePlaceholders &&  values.push(value);
      }
    }
  });
  
  return { conditions: conditions.length ? conditions.join(' AND ') : '', values };
}

export async function deleteRows(db: Database, table: string, where?: Where) {
  return new Promise((resolve, reject) => {
    const { conditions, values } = generateWhereClause(where);
    const sql = `DELETE FROM ${table} ${conditions}`;
    db.run(sql, values, function (err) {
      if (err) {
        console.error(`Failed to delete row from ${table} where ${conditions}...`, err);
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

export async function deleteRow(db: Database, table: string, where: Where) {
  return new Promise((resolve, reject) => {
    const { conditions, values } = generateWhereClause(where);
    const sql = `DELETE FROM ${table} WHERE id in (select id from ${table} where ${conditions} LIMIT 1)`;
    db.run(sql, values, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

function parseRow(columnDefs: ColumnDefLookup, table: string, row: any) {
  const objectColumns = getObjColumns(columnDefs, table);
  const booleanColumns = getBooleanColumns(columnDefs, table);
  const wasArray = Array.isArray(row)
  const rowArray =  wasArray ? row : [row];
  rowArray.forEach(row => {
    objectColumns.forEach(c => {
      if(row[c]) {
        (row)[c] = JSON.parse((row)[c] as string)
      }
    });
  
    booleanColumns.forEach(c => {
      (row)[c] = !!(row)[c];
    });
  });
  if(wasArray) {
    return rowArray;
  }

  return rowArray[0]
}

export async function queryRow(db: Database, columnDefs: ColumnDefLookup, table: string, options?: SqlLiteQueryOptions) {
  const rows = await queryRows(db, columnDefs, table, {
    ...(options || {}),
    pagination: options?.pagination || { page: 0, size: 1 },
  });
  return rows[0];
}

export async function queryRowsWhere(db: Database, columnDefs: ColumnDefLookup, table: string, where: Where, options?: Omit<SqlLiteQueryOptions, 'where'>) : Promise<any[]> {
  options = options || {};
  return queryRows(db, columnDefs, table, {
    ...options,
    where,
  })
}

function generateSqlSelect(columnDefs: ColumnDefLookup, table: string, options?: SqlLiteQueryOptions) : { sql: string, values?: any[] } {
  const { where, sort, pagination } = (options || {});
  const selectClause = generateSelectClause(columnDefs, table, options?.select, );
  let sql = `SELECT ${selectClause} FROM ${table}`;
  let values;
  if(where) {
    const generatedWhere = generateWhereClause(where);
    sql = `${sql} WHERE ${generatedWhere.conditions}`
    values = generatedWhere.values
  }
  if (sort?.sortBy) {
    const sortDirection = sort.sortDirection || 'asc';
    sql += ` ORDER BY ${sort.sortBy} ${sortDirection}`;
  }
   
  if (pagination) {
    if(typeof pagination === "object") {
      const offset = 'offset' in pagination ? pagination.offset : pagination.page * pagination.size;
      sql += ` LIMIT ${pagination.size} OFFSET ${offset}`;
    } else {
      sql += ` LIMIT ${pagination}`;
    }
  }
  return { sql, values }
}

export async function queryRowsBatch(db: Database, columnDefs: ColumnDefLookup, table: string, options: SqlLiteQueryOptions & { batchSize: number, recordCallback: (record: any, index: number) => Promise<void> | void }) : Promise<void> {
  const { batchSize } = options;
  const count = await countRows(db, columnDefs, table, options);
  let page = 0;
  let index = 0;
  while (page * batchSize < count) {
    const rows = await queryRows(db, columnDefs, table, {
      ...options,
      pagination: {
        size: batchSize,
        page,
      },
    });
    for (let i = 0; i < rows.length; i++) {
      await options.recordCallback(rows[i], index++);
    }
    page++;
  }
}
export async function queryRows(db: Database, columnDefs: ColumnDefLookup, table: string, options?: SqlLiteQueryOptions) : Promise<any[]> {
  return new Promise((resolve, reject) => {
    const { sql, values } = generateSqlSelect(columnDefs, table, options);
    db.all(sql, values, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if(table in columnDefs) {
          return resolve(parseRow(columnDefs, table as any, rows))
        }
        resolve(rows);
      }
    });
  });
}

export async function countRows(db: Database, columnDefs: ColumnDefLookup, table: string, options?: SqlLiteQueryOptions): Promise<number> {
  return new Promise((resolve, reject) => {
    const { sql, values } = generateSqlSelect(columnDefs, table, options);
    const countSql = `SELECT COUNT(*) AS count FROM (${sql})`;
    db.get(countSql, values, (err, row) => {
      if (err) {
        // console.error(`Failed to count rows from ${table} query was: ${countSql}`, err);
        reject(err);
      } else {
        resolve((<any>row).count);
      }
    });
  });
}

export async function insertOne<T>(db: Database, table: string, data: Omit<T, 'id'>) : Promise<T & { id: number }> {
  const { sql, values } = generateInsertSQL(table, data);
  return new Promise((resolve, reject) => {
    try {
      db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          (<T & { id: number }>data).id = this.lastID;
          resolve(data as T & { id: number });
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function upsertSqlLite<T>(
  db: Database,
  columnDefs: ColumnDefLookup,
  table: string,
  data: Partial<T>,
  upsertBy?: keyof T | (keyof T)[]
): Promise<T & { id: number }> {
  if(!upsertBy) {
    return insertOne(db, table, data as Omit<T, 'id'>);
  }

  const whereClause : any = {};

  const upsertByArray = Array.isArray(upsertBy) ? upsertBy : [upsertBy];

  if (!upsertByArray.length || !upsertByArray.every((key) => key in data)) {
    return insertOne(db, table, data as Omit<T, 'id'>);
  }
  upsertByArray.forEach(key => {
    whereClause[key] = data[key];
  });

  const foundValue = await queryRow(db, columnDefs, table, { where: whereClause });
  if (foundValue) {
    const newValue = {
      ...foundValue,
      ...data,
    };
    await updateOne(db, columnDefs, table, foundValue.id, newValue);
    return newValue;
  }
  return insertOne(db, table, data as Omit<T, 'id'>);
}
export async function allAsync(db: Database, query: string, values: any[]=[]) : Promise<any[]> {
  return new Promise((resolve, reject) => {
    db!.all(query, values, function(err, rows) {
      if(err) {
        return reject(err);
      }
      return resolve(rows);
    });
  })
}



function convertType(type: string) {
  if((["array", "object"]).includes(type.toLowerCase())) {
    return "TEXT";
  }
  if((["boolean", "bool"]).includes(type.toLowerCase())) {
    return "INTEGER"
  }
  return type;
}

function makeColumnDefString(col: ColumnDef, includeUnique=true) {
  let base = `${col.name} ${convertType(col.type)}`;
  if(col.unique && includeUnique) {
    base = `${base} UNIQUE`
  }
  if(col.primary) {
    if(col.type !== "INTEGER" && col.type !== "TEXT") {
      throw new Error(`only integers and strings can be primary keys`);
    }
    if(col.type === "TEXT") {
      base = `${base} PRIMARY KEY`
    } else {
      base = `${base} PRIMARY KEY AUTOINCREMENT`
    }
  }
  return base;
}

function getColumnDefinitions(columnDefs: ColumnDefLookup, table: string) {
  return columnDefs[table].map(col => makeColumnDefString(col)).join(', ');
}

function getForeignKeyReferences(columnDefs: ColumnDefLookup, table: string) {
  return columnDefs[table].filter(i => !!i.references).map(i => {
    return `FOREIGN KEY(${i.name}) REFERENCES ${i.references?.table}(${i.references?.column})`
  }).join('\n')
}

function getIndexDefinitions(columnDefs: ColumnDefLookup, table: string) {
  return columnDefs
    [table]
    .filter(col => col.index)
    .map(col => `CREATE INDEX IF NOT EXISTS idx_${col.name} ON ${table}(${col.name});`)
    .join('\n');
}


export async function createTable(db: Database, columnDefs: ColumnDefLookup, table: string, unique?: string[][]) {
  const uniqueString = unique ? unique.map(u => {
    return `UNIUQUE(${u.join(', ')})`
  }).join('\n') : '';
  
  const str = ([
    getColumnDefinitions(columnDefs, table),
    getForeignKeyReferences(columnDefs, table),
    uniqueString
  ]).filter(p => !!p).join(',\n')

  const createTableSql = `
  CREATE TABLE IF NOT EXISTS ${table} (${str});
`;
  return new Promise((resolve, reject) => {
    db.run(createTableSql, async (err) => {
      if (err) {
        console.error(`Failed to create ${table} table...`, err);
        reject(err);
      } else {
        try {
          await addMissingColumns(db, columnDefs, table);
          await createIndexes(db, columnDefs, table);
          resolve(db);
        } catch (err) {
          reject(err);
        }
      }
    });
  })
}

async function createIndexes(db: Database, columnDefs: ColumnDefLookup, table: string) {
  const indexSql = getIndexDefinitions(columnDefs, table);
  return new Promise((resolve, reject) => {
    db.exec(indexSql, (err) => {
      if (err) {
        console.error("Failed to create indexes...", err);
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

function columnExists(db: Database, tableName:string, columnName: string) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName});`, (err: any, rows: any[]) => {
      if (err) {
        reject(err);
      } else {
        const columnNames = rows.map(row => row.name);
        resolve(columnNames.includes(columnName));
      }
    });
  });
}

function addColumn(db: Database, tableName: string, columnDef: ColumnDef) {
  return new Promise((resolve, reject) => {
    let columnDefinition = `${columnDef.name} ${columnDef.type}`;
    
    if (columnDef.primary) {
      columnDefinition += ' PRIMARY KEY';
    }
    
    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

async function addMissingColumns(db: Database, columnDefs: ColumnDefLookup, tableName: string) {
  const defs: ColumnDef[] = columnDefs[tableName];
    for (const columnDef of defs) {
      const exists = await columnExists(db, tableName, columnDef.name);
      if(exists) continue;
      await addColumn(db, tableName, columnDef);
    }
}
