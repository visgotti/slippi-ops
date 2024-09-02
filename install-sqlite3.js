const { exec } = require('child_process');
const os = require('os');

const electronVersion = '18.2.1'; // Replace with your Electron version
const distUrl = 'https://electronjs.org/headers';

const installSqlite3 = () => {
  const command = os.platform() === 'darwin' 
  ?  `npm install sqlite3 --build-from-source --sqlite_libname=sqlcipher --sqlite=$(brew --prefix) --runtime=electron --target=${electronVersion} --dist-url=${distUrl}`
  : "npm install sqlite3 --build-from-source --runtime=electron --target=${electronVersion} --dist-url=${distUrl}"
  
  exec(command, { cwd: process.cwd() }, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error: ${err.message}`);
      return;
    }
    if(stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
  });
}

installSqlite3();
