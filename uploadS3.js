const AWS = require("aws-sdk");
require("dotenv").config();
const fs = require("fs");
const s3 = new AWS.S3({});
const uuid = require("uuid").v1;
const path = require("path");

module.exports = (Bucket, filepath) => {
  const folder = "development";
  const ext = path.extname(filepath);
  const Key = `${folder}/${uuid()}${ext}`;
  const Body = fs.readFileSync(filepath);
  const AWS_URI = `https://${Bucket}.s3.eu-west-2.amazonaws.com/${Key}`;
  const params = {
    Bucket,
    Key,
    Body,
    ContentType: "image/png",
  };

  s3.upload(params)
    .promise()
    .then(() => console.log(`Uploaded to ${AWS_URI}`))
    .catch((err) => console.log(err));
  return AWS_URI;
};
