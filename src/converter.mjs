import showdown from "showdown";
import handlebars from "handlebars";
import puppeteer from "puppeteer";

export async function handlebarsConvert(text, context = {}) {
  const template = handlebars.compile(text);
  return template(context);
}

export async function markdownConvert(text, options = {}) {
  const converter = new showdown.Converter(options);
  return converter.makeHtml(text);
}

export async function pdfConvert(html, options = {}) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  try {
    await page.setRequestInterception(true);
    page.once("request", request => {
      request.respond({ body: html });
      page.on("request", request => request.continue());
    });
    await page.goto("http://example.com");
    return await page.pdf(options);
  } catch (e) {
    return Promise.reject(e);
  } finally {
    browser.close();
  }
}
