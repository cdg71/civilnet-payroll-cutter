const fs = require("fs").promises;
const path = require("path");

const rwf = async (file, data) => {
  try {
    const filePath = path.dirname(file);
    let exists = false;
    exists = await fs.stat(filePath).catch(() => null);
    if (!exists) await fs.mkdir(filePath, { recursive: true });
    await fs.writeFile(file, data);
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = rwf;
