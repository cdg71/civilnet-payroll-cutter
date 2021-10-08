"use strict";
const winston = require("winston");
require("winston-daily-rotate-file");
const meta = require("../../package.json");

const createConsoleTransport = () =>
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.simple()
    ),
  });

const createFileTransport = (dirname, maxFiles) =>
  new winston.transports.DailyRotateFile({
    filename: `${meta.name}_%DATE%.log`,
    dirname,
    maxFiles,
  });

const createLogger = (level, transports) =>
  winston.createLogger({
    level,
    transports,
    exceptionHandlers: transports,
    format: winston.format.combine(
      winston.format.label({ label: `[${meta.name}]` }),
      winston.format.timestamp(),
      winston.format.json()
    ),
    exitOnError: true,
  });

module.exports = {
  createConsoleTransport,
  createFileTransport,
  createLogger,
};
