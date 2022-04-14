const fs = require("fs").promises;
require("dotenv").config();
const path = require("path");
const basedir = path.join(process.cwd(), "source");
const DATA_FILENAME = "data.json";
const uploadToS3 = require("./uploadS3");
let totalNumberOfQuestions = 0;

const getDirectories = async (source) =>
  (await fs.readdir(source, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const getImageNames = async (source) =>
  (await fs.readdir(source, { withFileTypes: true }))
    .filter((dirent) => dirent.isFile())
    .filter((dirent) => path.extname(dirent.name) === ".png")
    .map((dirent) => dirent.name);

const getAndUpload = (regEx, arr, folder) => {
  return arr
    .filter((filename) => regEx.test(filename))
    .map((filename) => uploadToS3("examweasel", path.join(folder, filename)));
};

const getAllDataFromFolder = async (folder) => {
  const fullPath = path.join(basedir, folder);
  const filename = path.join(fullPath, "data.json");
  const fileContents = await fs.readFile(filename, "utf8");
  questions = JSON.parse(fileContents);
  totalNumberOfQuestions += questions.length;
  const imageNames = await getImageNames(fullPath);
  return questions.map((q) => {
    console.log(q.month, q.year);
    const questionRegEx = new RegExp(`Q${q.number}(_[0-9])?.png`);
    const markSchemeRegEx = new RegExp(`MS_${q.number}(_[0-9])?.png`);
    const question_images = getAndUpload(questionRegEx, imageNames, fullPath);

    const mark_scheme_images = getAndUpload(
      markSchemeRegEx,
      imageNames,
      fullPath
    );
    return {
      number: q.number,
      date: new Date(`${q.year}-${q.month}`),
      topic: q.topic,
      subject: "Physics",
      award: "IGCSE",
      exam_board: "CIE",
      tags: [q.paper],
      question_images,
      mark_scheme_images,
      question_text: q.text,
      answer_text: q.answer,
      description: null,
    };
  });
};

const getQuestions = async (source) => {
  const dirs = await getDirectories(source);
  const allQuestions = [];
  let questionsFromDir;
  for (const dir of dirs) {
    console.log(`Reading from ${dir}...`);
    questionsFromDir = await getAllDataFromFolder(dir);
    allQuestions.push(...questionsFromDir);
  }
  return allQuestions;
};

getQuestions(basedir).then((result) => {
  const filename = "questions.js";
  const dataToWrite = "module.exports = " + JSON.stringify(result);
  fs.writeFile(filename, dataToWrite);
  console.log(`Written ${totalNumberOfQuestions} questions to file.`);
});
