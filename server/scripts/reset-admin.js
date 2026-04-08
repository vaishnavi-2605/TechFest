const mongoose = require("mongoose");

const { connectDatabase } = require("../src/utils/db");
const { resetDefaultAdmin } = require("../src/utils/seedUsers");

async function main() {
  try {
    await connectDatabase();
    const { action, user } = await resetDefaultAdmin();
    console.log(
      `Super admin ${action}: ${user.email} (${user.username})`
    );
  } catch (error) {
    console.error(`Failed to reset admin: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
}

main();
