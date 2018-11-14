#!/usr/bin/env node --experimental-modules

import fs from "fs";
import path from "path";
import yargs from "yargs";
import { asciidocConvert, handlebarsConvert, markdownConvert, pdfConvert } from "./converter.mjs";

const CONVERT_FORMATS = {
  ASCIIDOC: "ASCIIDOC",
  HTML: "HTML",
  MARKDOWN: "MARKDOWN"
};

const CONVERT_FORMATTER = {
  ASCIIDOC: asciidocConvert,
  HTML: input => input,
  MARKDOWN: markdownConvert
};

const argv = yargs
  .usage("Usage: $0 <source> [options]")
  .command("$0 <source>", "Converts a file to PDF")
  .option("format", {
    description: "Specifies the format of the source file. Will assume by extension if omitted."
  })
  .option("template", {
    description: "Selects an HTML template and puts the results of the selected source file into {{content}}",
    coerce: arg => {
      return fs.readFileSync(arg, "utf-8");
    }
  })
  .option("output", {
    description: "Sets the output filename",
    default: "output.pdf"
  })
  .option("html", {
    description: "Writes an HTML file before converting to PDF"
  })
  .config(
    "data",
    "uses the provided .json file to preprocess the source file with handlebars and provides the included variables.",
    configPath => (configPath ? { context: JSON.parse(fs.readFileSync(configPath, "utf-8")) } : {})
  )
  .help().argv;

run(argv).catch(error => console.error({ error }));

async function run({ source, context, format, html, template, output }) {
  const sourceHbs = fs.readFileSync(source, "utf-8");
  console.log("! 1")
  const templateHbs = template || "{{{ content }}}";
  console.log("! 2")
  const preprocessedContent = await handlebarsIfNecessary(sourceHbs, context);
  console.log("! 3")
  const htmlContent = await findConverter(format || formatByExtension(source))(preprocessedContent);
  console.log("! 4")
  const htmlData = await handlebarsIfNecessary(templateHbs, { ...context, content: htmlContent });
  console.log("! 5")
  const options = {
    format: "A4",
    displayHeaderFooter: true,
    margin: {
      top: "2cm",
      left: "2cm",
      right: "2cm",
      bottom: "2cm"
    }
  };
  const pdf = await pdfConvert(htmlData, options);
  console.log("! 6")
  if (html) {
    fs.writeFileSync(html, htmlData);
  }
  console.log("! 7")
  fs.writeFileSync(output, pdf);
}

async function handlebarsIfNecessary(sourceTemplate, context) {
  return context ? await handlebarsConvert(sourceTemplate, context) : sourceTemplate;
}

function findConverter(format) {
  const formatter = CONVERT_FORMATTER[format];
  console.log(`Formatting from ${format} to PDF`);
  return formatter;
}

function formatByExtension(filename) {
  console.log("format by extension", { filename });
  switch (path.extname(filename).toLowerCase()) {
    case ".ad":
    case ".adoc":
    case ".asciidoc":
      return CONVERT_FORMATS.ASCIIDOC;
    case ".htm":
    case ".html":
      return CONVERT_FORMATS.HTML;
    case ".md":
    case ".markdown":
      return CONVERT_FORMATS.MARKDOWN;
    default:
      return CONVERT_FORMATS.HTML;
  }
}
