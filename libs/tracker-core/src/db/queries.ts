import { Database } from "sqlite3";
import * as path from 'path';
import { columnDefs  } from "./columnDefs";

import { getObjColumns, getBooleanColumns, allAsync, generateWhereClause } from "@slippiops/sqllite";
import type { GameResultsQueryable, GameResults } from "@slippiops/types";

const objectColumns = getObjColumns(columnDefs, 'results');
const booleanColumns = getBooleanColumns(columnDefs, 'results');
export async function queryResultsSqlLite(db: Database, query: string, values: any[]) : Promise<GameResults[]> { 
  const rows = await allAsync(db, query, values);
   return rows.map((r: Partial<GameResults>) => {
     const o = {
       ...r,
     } as GameResults
 
     objectColumns.forEach(c => {
       if((<any>o)[c]) {
         (<any>o)[c] = JSON.parse((<any>o)[c] as string)
       }
     });
 
     booleanColumns.forEach(c => {
       (<any>o)[c] = !!(<any>o)[c];
     });
     return o;
   });
 }


 
export function generateCharacterStatsQuery(userIds: string[], characterId: number, options: GameResultsQueryable = {}) : string {
  const wherePlayer1 = generateWhereClause({ 
    player1Code: {
      oneOf: userIds,
    },
    player1Character: characterId,
    ...options,
  }, false);

  const wherePlayer2 = generateWhereClause({ 
    player2Code: {
      oneOf: userIds,
    },
    player2Character: characterId,
    ...options,
  }, false);

  return `
  SELECT 
      characterId,
      stageId,
      won,
      opponentCharacter,
      COUNT(*) AS count
  FROM (
      SELECT 
          player1Character AS characterId,
          stageId,
          CASE WHEN player1Won = 1 THEN 'yes' ELSE 'no' END AS won,
          player2Character AS opponentCharacter
      FROM 
          results
      WHERE
          ${wherePlayer1.conditions}
      
      UNION ALL
      
      SELECT 
          player2Character AS characterId,
          stageId,
          CASE WHEN player2Won = 1 THEN 'yes' ELSE 'no' END AS won,
          player1Character AS opponentCharacter
      FROM 
          results
      WHERE
          ${wherePlayer2.conditions}
  ) AS combined_results
  GROUP BY 
      characterId, stageId, won, opponentCharacter

  UNION ALL

  -- Total counts for each character on each stage
  SELECT 
      characterId,
      stageId,
      won,
      'Total' AS opponentCharacter,
      COUNT(*) AS count
  FROM (
      SELECT 
          player1Character AS characterId,
          stageId,
          CASE WHEN player1Won = 1 THEN 'yes' ELSE 'no' END AS won,
          player2Character AS opponentCharacter
      FROM 
          results
      WHERE
          ${wherePlayer1.conditions}
      
      UNION ALL
      
      SELECT 
          player2Character AS characterId,
          stageId,
          CASE WHEN player2Won = 1 THEN 'yes' ELSE 'no' END AS won,
          player1Character AS opponentCharacter
      FROM 
          results
      WHERE
          ${wherePlayer2.conditions}
  ) AS combined_results
  GROUP BY 
      characterId, stageId, won

  UNION ALL

  -- Total counts for wins and losses against each opponent character regardless of stage
  SELECT 
      characterId,
      'Total' AS stageId,
      won,
      opponentCharacter,
      COUNT(*) AS count
  FROM (
      SELECT 
          player1Character AS characterId,
          CASE WHEN player1Won = 1 THEN 'yes' ELSE 'no' END AS won,
          player2Character AS opponentCharacter
      FROM 
          results
      WHERE
          ${wherePlayer1.conditions}
      
      UNION ALL
      
      SELECT 
          player2Character AS characterId,
          CASE WHEN player2Won = 1 THEN 'yes' ELSE 'no' END AS won,
          player1Character AS opponentCharacter
      FROM 
          results
      WHERE
          ${wherePlayer2.conditions}
  ) AS combined_results
  GROUP BY 
      characterId, won, opponentCharacter

  UNION ALL

  -- Total counts for times played and won on each stage regardless of opponent character
  SELECT 
      characterId,
      stageId,
      won,
      'Total' AS opponentCharacter,
      COUNT(*) AS count
  FROM (
      SELECT 
          player1Character AS characterId,
          stageId,
          CASE WHEN player1Won = 1 THEN 'yes' ELSE 'no' END AS won
      FROM 
          results
      WHERE
          ${wherePlayer1.conditions}
      
      UNION ALL
      
      SELECT 
          player2Character AS characterId,
          stageId,
          CASE WHEN player2Won = 1 THEN 'yes' ELSE 'no' END AS won
      FROM 
          results
      WHERE
          ${wherePlayer2.conditions}
  ) AS combined_results
  GROUP BY 
      characterId, stageId, won

  UNION ALL

  -- Grand total count
  SELECT 
      'Total' AS characterId,
      'Total' AS stageId,
      'Total' AS won,
      'Total' AS opponentCharacter,
      COUNT(*) AS count
  FROM (
      SELECT 
          player1Character AS characterId,
          stageId,
          CASE WHEN player1Won = 1 THEN 'yes' ELSE 'no' END AS won,
          player2Character AS opponentCharacter
      FROM 
          results
      WHERE
          ${wherePlayer1.conditions}
      
      UNION ALL
      
      SELECT 
          player2Character AS characterId,
          stageId,
          CASE WHEN player2Won = 1 THEN 'yes' ELSE 'no' END AS won,
          player1Character AS opponentCharacter
      FROM 
          results
      WHERE
          ${wherePlayer2.conditions}
  ) AS combined_results
  `;
}



export async function checkFilesNotExist(db: Database,  table: string, filePaths: string[], batchSize = 999, usePathInsteadOfFileName: boolean): Promise<string[]> {
    const fileNames = usePathInsteadOfFileName ? filePaths : filePaths.map(f => path.basename(f));
    const dataProp = usePathInsteadOfFileName ? 'slpFilePath' : 'slpFile';
    const existingFileNames = await checkExistInBatches(db, table, fileNames, batchSize, dataProp);
    // console.time('filter')
    const filtered = filePaths.filter((_, i) => !existingFileNames[fileNames[i]]);
    // console.timeEnd('filter');
    return filtered;
  }
  
   async function checkExistInBatches(db: Database, table: string, values: string[], batchSize = 999, prop: string): Promise< {[key: string]: boolean }> {
    const results : {[key: string]: boolean } = {};
    
    for (let i = 0; i < values.length; i += batchSize) {
      const batch = values.slice(i, i + batchSize);
      const placeholders = values.map(() => '?').join(', ');
      const sql = `SELECT ${prop} FROM ${table} WHERE ${prop} IN (${placeholders})`;
  
      await new Promise((resolve, reject) => {
        db.all(sql, batch, (err, rows) => {
          if (err) {
            // console.error(`Failed to query slpFile from ${table}...`, err);
            reject(err);
          } else {
            rows.forEach(r => {
              results[(<any>r)[prop] as string] = true;
            })
            resolve(true);
          }
        });
      });
    }
    return results;
  }


export function generateOpponentCharacterStatsQuery(userIds: string[], characterId: number, options: GameResultsQueryable = {}) : string {
  const wherePlayer1 = generateWhereClause({ 
    player1Code: {
      notOneOf: userIds,
    },
    player1Character: characterId,
    ...options,
  });

  const wherePlayer2 = generateWhereClause({ 
    player2Code: {
      notOneOf: userIds,
    },
    player2Character: characterId,
    ...options,
  });

  // Convert userIds array to a comma-separated string
  return `
  SELECT 
      characterId,
      stageId,
      won,
      yourCharacter,
      COUNT(*) AS count
  FROM (
      SELECT 
          player1Character AS characterId,
          stageId,
          CASE WHEN player1Won = 1 THEN 'yes' ELSE 'no' END AS won,
          player2Character AS yourCharacter
      FROM 
          results
      WHERE
          ${wherePlayer1}
      
      UNION ALL
      
      SELECT 
          player2Character AS characterId,
          stageId,
          CASE WHEN player2Won = 1 THEN 'yes' ELSE 'no' END AS won,
          player1Character AS yourCharacter
      FROM 
          results
      WHERE
          ${wherePlayer2}
  ) AS combined_results
  GROUP BY 
      characterId, stageId, won, yourCharacter

  UNION ALL

  -- Total counts for each character on each stage
  SELECT 
      characterId,
      stageId,
      won,
      'Total' AS yourCharacter,
      COUNT(*) AS count
  FROM (
      SELECT 
          player1Character AS characterId,
          stageId,
          CASE WHEN player1Won = 1 THEN 'yes' ELSE 'no' END AS won,
          player2Character AS yourCharacter
      FROM 
          results
      WHERE
          ${wherePlayer1}
      
      UNION ALL
      
      SELECT 
          player2Character AS characterId,
          stageId,
          CASE WHEN player2Won = 1 THEN 'yes' ELSE 'no' END AS won,
          player1Character AS yourCharacter
      FROM 
          results
      WHERE
          ${wherePlayer2}
  ) AS combined_results
  GROUP BY 
      characterId, stageId, won

  UNION ALL

  -- Total counts for wins and losses against each opponent character regardless of stage
  SELECT 
      characterId,
      'Total' AS stageId,
      won,
      yourCharacter,
      COUNT(*) AS count
  FROM (
      SELECT 
          player1Character AS characterId,
          CASE WHEN player1Won = 1 THEN 'yes' ELSE 'no' END AS won,
          player2Character AS yourCharacter
      FROM 
          results
      WHERE
          ${wherePlayer1}
      
      UNION ALL
      
      SELECT 
          player2Character AS characterId,
          CASE WHEN player2Won = 1 THEN 'yes' ELSE 'no' END AS won,
          player1Character AS yourCharacter
      FROM 
          results
      WHERE
          ${wherePlayer2}
  ) AS combined_results
  GROUP BY 
      characterId, won, yourCharacter

  UNION ALL

  -- Total counts for times played and won on each stage regardless of opponent character
  SELECT 
      characterId,
      stageId,
      won,
      'Total' AS yourCharacter,
      COUNT(*) AS count
  FROM (
      SELECT 
          player1Character AS characterId,
          stageId,
          CASE WHEN player1Won = 1 THEN 'yes' ELSE 'no' END AS won
      FROM 
          results
      WHERE
          ${wherePlayer1}
      
      UNION ALL
      
      SELECT 
          player2Character AS characterId,
          stageId,
          CASE WHEN player2Won = 1 THEN 'yes' ELSE 'no' END AS won
      FROM 
          results
      WHERE
          ${wherePlayer2}
  ) AS combined_results
  GROUP BY 
      characterId, stageId, won

  UNION ALL

  -- Grand total count
  SELECT 
      'Total' AS characterId,
      'Total' AS stageId,
      'Total' AS won,
      'Total' AS yourCharacter,
      COUNT(*) AS count
  FROM (
      SELECT 
          player1Character AS characterId,
          stageId,
          CASE WHEN player1Won = 1 THEN 'yes' ELSE 'no' END AS won,
          player2Character AS yourCharacter
      FROM 
          results
      WHERE
          ${wherePlayer1}
      
      UNION ALL
      
      SELECT 
          player2Character AS characterId,
          stageId,
          CASE WHEN player2Won = 1 THEN 'yes' ELSE 'no' END AS won,
          player1Character AS yourCharacter
      FROM 
          results
      WHERE
          ${wherePlayer2}
  ) AS combined_results
  `;
}