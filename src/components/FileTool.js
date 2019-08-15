import fs from "fs";
import zlib from "zlib";
import CSVtoJSON from "csvtojson";
import Logger from "utils/Logger";

const logger = Logger.getContextLogger("file-tool");

export default class FileTool {
  /**
   * @param {string} filePath
   * @returns {Promise<string>}
   */
  static async unzip(filePath) {
    logger.debug("unzipping file in path", filePath);
    const split = filePath.split(".gz");
    const newPath = split[0];

    const fileContents = fs.createReadStream(filePath);
    const writeStream = fs.createWriteStream(newPath);
    const unzip = zlib.createGunzip();

    return new Promise((resolve, reject) => {
      fileContents.pipe(unzip).pipe(writeStream)
        .on("finish", (err) => {
          if (err) return reject(err);
          logger.debug("unzipped with new path", newPath);
          resolve(newPath);
        });
    });
  }

  /**
   * @param {string} filePath
   * @returns {Promise<string>}
   */
  static async createJSON(filePath) {
    logger.debug("creating json from file path", filePath);
    const split = filePath.split(".csv");
    const newPath = `${split[0]}.json`;

    const jsonArray = await CSVtoJSON().fromFile(filePath);
    const jsonString = JSON.stringify(jsonArray);
    const jsonKeys = Object.keys(jsonArray[0]);

    logger.debug("json keys", jsonKeys);

    return new Promise((resolve, reject) => {
      fs.writeFile(newPath, jsonString, (err) => {
        if (err) return reject(err);
        logger.debug("json created with new path", newPath);
        resolve({ path: newPath, keys: jsonKeys });
      });
    });
  }
}
