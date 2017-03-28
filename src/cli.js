import path from 'path'
import Server from './Server'
import Crawler from './Crawler'
import Writer from './Writer'
import fs from "fs";
import url from 'url'
import rimraf from 'rimraf'
export default () => {

  let basePath = "/";
  const json = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
  let serveDir = path.resolve('./build')
  let tmpServeDir = null;
  if (json.homepage) {
    const urlParts = url.parse(json.homepage)
    basePath = urlParts.path;
    tmpServeDir = "./servebuild-tmp"
    rimraf.sync(tmpServeDir)
    fs.mkdirSync(tmpServeDir)
    fs.symlinkSync("../build", tmpServeDir + basePath)
    serveDir = path.resolve(tmpServeDir)
  } else {

  }
  const baseDir = path.resolve('./build')
  const writer = new Writer(baseDir)
  writer.move('index.html', '200.html')


  const server = new Server(serveDir, basePath + '/200.html', 2999)
  server.start()
  .then(() => {

    const crawler = new Crawler("http://localhost:2999" + basePath)
    return crawler.crawl(({ path, html }) => {
      const filename = `${path}${path.endsWith('/') ? 'index' : ''}.html`
      console.log(`✏️   Saving ${path} as ${filename}`)
      writer.write(filename, html)
    })

  }).then(() => {
    rimraf.sync(tmpServeDir)
    server.stop()
  }, err => console.log(err))
}
