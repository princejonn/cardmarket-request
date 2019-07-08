import fs from "fs";
import zlib from "zlib";
import CSVtoJSON from "csvtojson";

export default class FileTool {
  /**
   * @param {string} filePath
   * @returns {Promise<string>}
   */
  static async unzip(filePath) {
    const split = filePath.split(".gz");
    const newPath = split[0];

    const fileContents = fs.createReadStream(filePath);
    const writeStream = fs.createWriteStream(newPath);
    const unzip = zlib.createGunzip();

    return new Promise((resolve, reject) => {
      fileContents.pipe(unzip).pipe(writeStream)
        .on("finish", (err) => {
          if (err) return reject(err);
          resolve(newPath);
        });
    });
  }

  /**
   * @param {string} filePath
   * @returns {Promise<string>}
   */
  static async createJSON(filePath) {
    const split = filePath.split(".csv");
    const newPath = `${split[0]}.json`;

    const jsonArray = await CSVtoJSON().fromFile(filePath);
    const jsonString = JSON.stringify(jsonArray);
    const jsonKeys = Object.keys(jsonArray[0]);

    return new Promise((resolve, reject) => {
      fs.writeFile(newPath, jsonString, (err) => {
        if (err) return reject(err);
        resolve({ path: newPath, keys: jsonKeys });
      });
    });
  }
}
