# convert2pdf

Converts a text file to a PDF.

It currently supports HTML and Markdown to PDF. Markdown will be preprocessed into HTML and then converted to PDF using Puppeteer.

## Setup

`npm install`
and then link to the executable:
`npm link`

When you have `node_modules/.bin` in your PATH, you can simply run `convert2pdf`.
Alternatively you can invoke it with `node_modules/.bin/convert2pdf`.

## Usage

```
convert2pdf <source> [--format <format>] [--data <json-file>] [--template <template-file>] [--output <pdf-name>] [--html <html-name>]
```

```
Options:
  --version   Show version number                                      [boolean]
  --format    Specifies the format of the source file. Will assume by extension
              if omitted.
  --template  Selects an HTML template and puts the results of the selected
              source file into {{content}}
  --output    Sets the output filename                   [default: "output.pdf"]
  --html      Writes an HTML file before converting to PDF
  --data      uses the provided .json file to preprocess the source file with
              handlebars and provides the included variables.
  --help      Show help                                                [boolean]

```

## Tips and tricks

* When you want to display images, make sure they're recognized as content. Background is not shown per default and it's hard to convince the browser to show it in a print setting.
* When working with chrome page layout options, make sure that
  headerTemplate and footerTemplate have a left margin of at least about 10px and proper font-size. Otherwise, you won't see them.
(see https://github.com/GoogleChrome/puppeteer/issues/1853 and https://github.com/GoogleChrome/puppeteer/issues/1822)
