const { createReadStream, createWriteStream } = require("fs");
const { pipeline } = require("stream");
const { promisify } = require("util");
const { v4: uuidV4 } = require("uuid");
const { parser } = require("stream-csv-as-json");
const { asObjects } = require("stream-csv-as-json/AsObjects");
const { streamValues } = require("stream-json/streamers/StreamValues");
const bcrypt = require("bcrypt");

class Service {
  #pipeline = promisify(pipeline);
  #listFiles = [];
  #listIds = {
    states: [],
    cities: [],
  };

  constructor(listFiles) {
    this.#listFiles = listFiles;
  }

  async execute() {
    for (const file of this.#listFiles) {
      const stream = createReadStream(file.input);

      switch (file.name) {
        case "1-usuario":
          await this.#runProcess(stream, this.#mapUsers, file.output);
          break;
        case "2-categoria":
          await this.#runProcess(stream, this.#mapCategories, file.output);
          break;
        case "3-segmento":
          await this.#runProcess(stream, this.#mapSegments, file.output);
          break;
        case "4-grupo-idade":
          await this.#runProcess(stream, this.#mapAgeGroups, file.output);
          break;
        case "5-intervalo-renda":
          await this.#runProcess(stream, this.#mapIncomeRange, file.output);
          break;
        case "6-estado":
          await this.#runProcess(stream, this.#mapStates, file.output);
          break;
        case "7-cidade":
          await this.#runProcess(stream, this.#mapCities, file.output);
          break;
        case "8-bairro":
          await this.#runProcess(stream, this.#mapNeighborhoods, file.output);
          break;
      }
    }
  }

  #replaceParamsSQL(sql, params) {
    const regex = new RegExp(":[a-zA-Z_][a-zA-Z0-9_]*", "g");

    const sqlModified = sql.replace(regex, (match) => {
      const param = match.replace(":", "");
      if (params[param]) {
        switch (params[param].type) {
          case "string":
            if (!this.#isNil(params[param].value)) {
              return `'${params[param].value}'`;
            }
          case "number":
            if (!this.#isNil(params[param].value)) {
              return `${params[param].value}`;
            }
          default:
            return null;
        }
      }
      return match;
    });

    return sqlModified;
  }

  #isNil(value) {
    return value === null || value === undefined;
  }

  async #runProcess(stream, fnMap, output) {
    return this.#pipeline(
      stream,
      parser(),
      asObjects(),
      streamValues(),
      fnMap.bind(this),
      createWriteStream(output)
    );
  }

  async *#mapCategories(source) {
    for await (const { value } of source) {
      yield this.#replaceParamsSQL(
        "INSERT IGNORE INTO categories (id, name, description) VALUES (:id, :name, :description);\r",
        {
          id: { type: "string", value: uuidV4() },
          name: { type: "string", value: value.nome },
          description: { type: "string", value: value.descricao },
        }
      );
    }
  }

  async *#mapSegments(source) {
    for await (const { value } of source) {
      yield this.#replaceParamsSQL(
        "INSERT IGNORE INTO segments (id, big_id, name, description) VALUES (:id, :bigId, :name, :description);\r",
        {
          id: { type: "string", value: uuidV4() },
          bigId: { type: "number", value: value.id },
          name: { type: "string", value: value.nome },
          description: { type: "string", value: value.descricao },
        }
      );
    }
  }

  async *#mapAgeGroups(source) {
    for await (const { value } of source) {
      yield this.#replaceParamsSQL(
        "INSERT IGNORE INTO age_groups (id, big_id, name, age_min, age_max) VALUES (:id, :bigId, :name, :ageMin, :ageMax);\r",
        {
          id: { type: "string", value: uuidV4() },
          bigId: { type: "number", value: value.id },
          name: { type: "string", value: value.nome },
          ageMin: { type: "number", value: value.min },
          ageMax: { type: "number", value: value.max },
        }
      );
    }
  }

  async *#mapIncomeRange(source) {
    for await (const { value } of source) {
      yield this.#replaceParamsSQL(
        "INSERT IGNORE INTO income_ranges (id, big_id, name, income_min, income_max) VALUES (:id, :bigId, :name, :incomeMin, :incomeMax);\r",
        {
          id: { type: "string", value: uuidV4() },
          bigId: { type: "number", value: value.id },
          name: { type: "string", value: value.nome },
          incomeMin: { type: "number", value: value.min },
          incomeMax: { type: "number", value: value.max },
        }
      );
    }
  }

  async *#mapUsers(source) {
    for await (const { value } of source) {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash(value.senha, salt);

      yield this.#replaceParamsSQL(
        "INSERT IGNORE INTO users (id, name, email, password, role) VALUES (:id, :name, :email, :password, :role);\r",
        {
          id: { type: "string", value: uuidV4() },
          name: { type: "string", value: value.nome },
          email: { type: "string", value: value.email },
          password: { type: "string", value: password },
          role: { type: "string", value: value.tipo },
        }
      );
    }
  }

  async *#mapStates(source) {
    for await (const { value } of source) {
      const uuid = uuidV4();
      if (!this.#listIds.states.find((state) => state.uf === value.uf)) {
        this.#listIds.states.push({ uf: value.uf, id: uuid });
      }

      yield this.#replaceParamsSQL(
        "INSERT IGNORE INTO states (id, name, abbreviation) VALUES (:id, :name, :abbreviation);\r",
        {
          id: { type: "string", value: uuid },
          name: { type: "string", value: value.estado },
          abbreviation: { type: "string", value: value.uf },
        }
      );
    }
  }

  async *#mapCities(source) {
    for await (const { value } of source) {
      if (value.cidade_id === "NULL") continue;

      const uuid = uuidV4();
      if (
        !this.#listIds.cities.find((city) => city.big_id === value.cidade_id)
      ) {
        this.#listIds.cities.push({ big_id: value.cidade_id, id: uuid });
      }

      const state = this.#listIds.states.find((state) => state.uf === value.uf);
      yield this.#replaceParamsSQL(
        "INSERT IGNORE INTO cities (id, big_id, state_id, name) VALUES (:id, :bigId, :stateId, :name);\r",
        {
          id: { type: "string", value: uuid },
          bigId: { type: "number", value: value.cidade_id },
          stateId: { type: "string", value: state.id },
          name: { type: "string", value: value.cidade },
        }
      );
    }
  }

  async *#mapNeighborhoods(source) {
    for await (const { value } of source) {
      if (value.bairro_id === "NULL") continue;

      const city = this.#listIds.cities.find(
        (city) => city.big_id === value.cidade_id
      );
      yield this.#replaceParamsSQL(
        "INSERT IGNORE INTO neighborhoods (id, big_id, city_id, name) VALUES (:id, :bigId, :cityId, :name);\r",
        {
          id: { type: "string", value: uuidV4() },
          bigId: { type: "number", value: value.bairro_id },
          cityId: { type: "string", value: city.id },
          name: { type: "string", value: value.bairro },
        }
      );
    }
  }
}

module.exports = Service;
