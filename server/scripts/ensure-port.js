const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function readPortFromEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return null;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^PORT\s*=\s*(\d+)\s*$/);
    if (match) return Number(match[1]);
  }
  return null;
}

function safeKillPid(pid) {
  try {
    execSync(`kill -9 ${pid}`);
    return true;
  } catch {
    return false;
  }
}

function main() {
  const port = readPortFromEnv();
  if (!port) return;

  let pids = [];
  try {
    const output = execSync(`lsof -t -i :${port}`, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    if (output) {
      pids = output.split(/\s+/).map((val) => Number(val)).filter(Boolean);
    }
  } catch {
    return;
  }

  if (!pids.length) return;

  for (const pid of pids) {
    let cmd = "";
    try {
      cmd = execSync(`ps -p ${pid} -o command=`, { stdio: ["ignore", "pipe", "ignore"] }).toString();
    } catch {
      continue;
    }
    const isOurServer = /node\s+-r\s+dotenv\/config\s+src\/index\.js/.test(cmd)
      || /nodemon/.test(cmd);
    if (isOurServer) {
      safeKillPid(pid);
    } else {
      console.error(`Port ${port} is in use by another process (PID ${pid}). Please free the port.`);
      process.exit(1);
    }
  }
}

main();
