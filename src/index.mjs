#!/usr/bin/env node --experimental-modules

import fs from "fs";
import path from "path";
import yargs from "yargs";
import { handlebarsConvert, markdownConvert, pdfConvert } from "./converter.mjs";

const CONVERT_FORMATS = {
  HTML: "HTML",
  MARKDOWN: "MARKDOWN"
};

const CONVERT_FORMATTER = {
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
  const templateHbs = template || "{{{ content }}}";
  const preprocessedContent = await handlebarsIfNecessary(sourceHbs, context);
  const htmlContent = await findConverter(format || formatByExtension(source))(preprocessedContent);
  const htmlData = await handlebarsIfNecessary(templateHbs, { ...context, content: htmlContent });
  const css = await headerFooterCss();
  const options = { format: "A4",
                    headerTemplate: css + "<div><span class=\"hdr\"></span></div>",
                    footerTemplate: css + "<div><p>Seite&nbsp;</p><p class=\"pageNumber\"></p><p>&nbsp;von&nbsp;</p><p class=\"totalPages\"></p></div>",
                    displayHeaderFooter: true,
                    margin: {
                      top: "2cm",
                      left: "2cm",
                      right: "2cm",
                      bottom: "2cm"
                    }
                  };
  const pdf = await pdfConvert(htmlData, options);
  if (html) {
    fs.writeFileSync(html, htmlData);
  }
  fs.writeFileSync(output, pdf);
}

async function handlebarsIfNecessary(sourceTemplate, context) {
  return context ? await handlebarsConvert(sourceTemplate, context) : sourceTemplate;
}

function headerFooterCss() {
  let cssb = [];
  cssb.push("<style>");
  cssb.push("div { margin-left:30px;}");
  /* "background" is not shown in print; "content" is */
  cssb.push(`span.hdr { content: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFUAAAAWCAYAAACxOdCYAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAABDBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIgogICAgICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyI+CiAgICAgICAgIDx0aWZmOlJlc29sdXRpb25Vbml0PjM8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDx0aWZmOkNvbXByZXNzaW9uPjU8L3RpZmY6Q29tcHJlc3Npb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjM2MDAvMTI3PC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj4zNjAwLzEyNzwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9uPjg1PC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6Q29sb3JTcGFjZT4xPC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj4yMjwvZXhpZjpQaXhlbFlEaW1lbnNp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") }`);
  cssb.push("p { font-size:10px; float: left}");
  cssb.push("</style>");

  return cssb.join("");
}

function findConverter(format) {
  const formatter = CONVERT_FORMATTER[format];
  console.log(`Formatting from ${format} to PDF`);
  return formatter;
}

function formatByExtension(filename) {
  console.log("format by extension", { filename });
  switch (path.extname(filename).toLowerCase()) {
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
