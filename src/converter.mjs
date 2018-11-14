import Asciidoctor from "asciidoctor.js";
import showdown from "showdown";
import Handlebars from "handlebars";
import puppeteer from "puppeteer";

export async function handlebarsConvert(text, context = {}) {
  const template = Handlebars.compile(text);
  return template(context);
}

export async function markdownConvert(text, options = {}) {
  const converter = new showdown.Converter(options);
  return converter.makeHtml(text);
}

export async function asciidocConvert(text) {
  console.log("CONVERTING ASCIIDOC");
  const converter = new Asciidoctor();
  return converter.convert(text);
}

export async function pdfConvert(html, options = {}) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  try {
    let headerTemplate = await page.evaluate(() => {
      const headerTemplate = document.getElementById("header-template");
      return headerTemplate ? headerTemplate.innerHTML.toString() : "";
    });
    let footerTemplate = await page.evaluate(() => {
      const footerTemplate = document.getElementById("footer-template");
      return footerTemplate ? footerTemplate.innerHTML.toString() : "";
    });
    let showHeaderOnFirstPage = await page.evaluate(() => {
      const headerTemplate = document.getElementById("header-template");
      return Number(headerTemplate ? headerTemplate.dataset.showOnFirstPage : "1");
    });

    if (!showHeaderOnFirstPage) {
      await page.addStyleTag({
        content: "@page:first {margin: 0 1cm 3cm 1cm;} body {margin: 3cm 0 0 0;}"
      });
    }

    return await page.pdf({
      ...options,
      headerTemplate,
      footerTemplate,
      printBackground: true
    });
  } catch (e) {
    return Promise.reject(e);
  } finally {
    browser.close();
  }
}
