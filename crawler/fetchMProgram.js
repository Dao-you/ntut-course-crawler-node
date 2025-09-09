const { fetchSinglePage } = require("./fetchSinglePage");
const jsonfile = require("jsonfile");
const fs = require("fs");
const pangu = require("./tools/pangu").spacing;

const globalRegexParse = /\n|^ | $/g;

async function fetchProgramCourse(href) {
  const url = "https://aps.ntut.edu.tw/course/tw/" + href;
  const $ = await fetchSinglePage(url);
  $("tr:first-child").remove();
  $("tr:last-child").remove();
  const courses = [];
  for (const tr of $("tr")) {
    const id = $($(tr).children("td")[0]).text().replace(globalRegexParse, "");
    const nameLink = $($(tr).children("td")[1]).find("a");
    if (!id || !nameLink.length) continue;
    courses.push({
      id,
      name: pangu(nameLink.text().replace(globalRegexParse, "")),
      href: nameLink.attr("href"),
    });
  }
  return courses;
}

async function fetchMProgram(year = 110, sem = 2) {
  console.log("[fetch] 正在取得微學程列表...");
  const url = `https://aps.ntut.edu.tw/course/tw/SearchMProgram.jsp?format=-1&year=${year}&sem=${sem}`;
  const $ = await fetchSinglePage(url);
  const programs = $("a[href^='SearchMProgram.jsp?format=-2']");
  const res = [];
  let progress = 0;
  for (const program of programs) {
    const name = pangu($(program).text());
    const href = $(program).attr("href");
    progress++;
    console.log(`[fetch] 正在取得 (${progress}/${programs.length}) ${name}`);
    const course = await fetchProgramCourse(href);
    res.push({ name, href, course });
  }
  fs.mkdirSync(`./dist/${year}/${sem}/`, { recursive: true });
  jsonfile.writeFileSync(`./dist/${year}/${sem}/mprogram.json`, res, {
    spaces: 2,
    EOL: "\r\n",
  });
}

module.exports = { fetchMProgram };
