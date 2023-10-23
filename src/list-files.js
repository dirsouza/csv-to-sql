const { join } = require("path");

const { FOLDER_NAME } = require("./constants.js");

function getInputFile(name) {
  return join(FOLDER_NAME.INPUT, `${name}.csv`);
}

function getOutputFile(name) {
  return join(FOLDER_NAME.OUTPUT, `${name}.sql`);
}

const listFiles = [
  {
    name: "1-usuario",
    get input() {
      return getInputFile(this.name);
    },
    get output() {
      return getOutputFile(this.name);
    },
  },
  {
    name: "2-categoria",
    get input() {
      return getInputFile(this.name);
    },
    get output() {
      return getOutputFile(this.name);
    },
  },
  {
    name: "3-segmento",
    get input() {
      return getInputFile(this.name);
    },
    get output() {
      return getOutputFile(this.name);
    },
  },
  {
    name: "4-grupo-idade",
    get input() {
      return getInputFile(this.name);
    },
    get output() {
      return getOutputFile(this.name);
    },
  },
  {
    name: "5-intervalo-renda",
    get input() {
      return getInputFile(this.name);
    },
    get output() {
      return getOutputFile(this.name);
    },
  },
  {
    name: "6-estado",
    get input() {
      return getInputFile(this.name);
    },
    get output() {
      return getOutputFile(this.name);
    },
  },
  {
    name: "7-cidade",
    get input() {
      return getInputFile(this.name);
    },
    get output() {
      return getOutputFile(this.name);
    },
  },
  {
    name: "8-bairro",
    get input() {
      return getInputFile(this.name);
    },
    get output() {
      return getOutputFile(this.name);
    },
  },
];

module.exports = listFiles;
