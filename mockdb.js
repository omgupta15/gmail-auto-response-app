import { readFileSync, writeFile } from "fs";

const dbFilePath = new URL("db.json", import.meta.url);

let savedData = null;
try {
  savedData = JSON.parse(
    readFileSync(dbFilePath, { encoding: "utf-8" }).toString()
  );
  console.log("Saved data loaded.");
} catch (err) {
  console.log("Saved data not found. Creating an empty db...");
}

const db = {
  users: savedData?.users || [],
};

const save = function () {
  const data = JSON.stringify(db);
  writeFile(dbFilePath, Buffer.from(data), () => {
    console.log("DB Saved.");
  });
};
db.save = save;

export default db;
