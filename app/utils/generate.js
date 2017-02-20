// https://en.wikipedia.org/wiki/Special:Random is the link to a random page
import request from 'request';

const getTitle = (body) => {
  let title = body.match(/<title>(.+) - Wikipedia<\/title>/i)[1];
  const parser = new DOMParser();
  const dom = parser.parseFromString(
    `<!doctype html><body>${title}`,
    'text/html');
  title = dom.body.textContent;
  return title;
};

const getWikiLinks = (body) => {
  const htmlRegex = /<a href="\/wiki\/.+?" title.+?">/gi;
  const linkRegex = /\/wiki\/.+?(?=")/;
  const matches = [];
  let match = [];
  while ((match = htmlRegex.exec(body)) != null) { // eslint-disable-line
    if (!match[0].includes(':') && !match[0].includes('Main_Page')) { // If it is a special kind of link or the main page for Wikipedia
      matches.push(`https://en.wikipedia.org${linkRegex.exec(match[0])}`);
    }
  }
  return matches;
};

const getLinksToPath = (title, cb) => {
  request(`https://en.wikipedia.org/w/index.php?title=Special%3AWhatLinksHere&limit=500&target=${title}&namespace=0`, (error, response, body) => {
    if (error) {
      return cb(error);
    }
    return cb(null, getWikiLinks(body).filter((url) => !url.includes(title)));
  });
};

class Path {
  constructor(path) {
    this.path = path;
  }

  async generate() {
    return new Promise((resolve, reject) => {
      request(this.path[this.path.length - 1], (error, response, body) => {
        if (!error && response.statusCode === 200) {
          const links = getWikiLinks(body);
          const newPaths = [];
          links.forEach((link) => {
            if (!this.path.includes(link)) {
              newPaths.push(new Path([...this.path, link]));
            }
          });
          return resolve(newPaths);
        }
        return reject(new Error('Error getting wiki page.'));
      });
    });
  }
}

const turnPathToLink = (path) => (
  new Promise((resolve, reject) => {
    request(path, (error, response, body) => {
      if (error) {
        return reject(error);
      }
      return resolve({ title: getTitle(body), link: path });
    });
  })
);

const getPath = async (url1, url2, cb) => {
  const paths = [];
  paths.push(new Path([url1]));
  try {
    while (true) { // eslint-disable-line
      let potentialPath =
      paths.filter((finalPath) => (finalPath.path.includes(url2)));
      if (potentialPath.length > 0) {
        potentialPath = potentialPath[0].path;
        const finalPath = [];
        potentialPath.map(async (path) => {
          try {
            finalPath.push(turnPathToLink(path));
          } catch (e) {
            return cb(e);
          }
        });
        return cb(null, await Promise.all(finalPath)); // eslint-disable-line
      }
      const generateFunctions = [];
      while (paths.length > 0) {
        generateFunctions.push(paths.pop().generate());
      }
      const results = await Promise.all(generateFunctions); //eslint-disable-line
      results.forEach((path) => {
        paths.push(...path);
      });
    }
  } catch (e) {
    return cb(e);
  }
};

const getRandomPathTo = (url, distance, history, cb) => {
  const tempHistory = history;
  if (distance <= 0) {
    return cb(null, history);
  }
  try {
    const linkRegex = /(\/wiki\/)(.*)/gi;
    const linkTitle = linkRegex.exec(url)[2];
    getLinksToPath(linkTitle, (err, links) => {
      const nextLink = links[Math.floor(Math.random() * (links.length - 1))];
      request(url, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          history.unshift({ title: getTitle(body), link: url });
          return getRandomPathTo(nextLink, distance - 1, history, cb);
        } else if (history.length === 0) {
          return getRandomPathTo(
            history[history.length - 2],
            distance + 1,
            history.slice(0, history.length - 1),
            cb);
        }
        return cb(new Error('Error getting wiki page.'));
      });
    });
  } catch (e) {
    console.log(e);
    console.log(history);
    return getRandomPathTo(
      tempHistory[tempHistory.length - 2],
      distance + 1,
      tempHistory.slice(0, tempHistory.length - 1),
      cb);
  }
};

const getRandomPathFrom = (url, distance, history, cb) => {
  request(url, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const tempHistory = history;
      try {
        const title = getTitle(body);
        const links = getWikiLinks(body);
        const nextLink = links[Math.floor(Math.random() * (links.length - 1))];
        history.push({ title, link: (response.request.uri.href) });
        if (distance <= 0) {
          return cb(null, history);
        }
        return getRandomPathFrom(nextLink, distance - 1, history, cb);
      } catch (e) {
        console.log(e);
        console.log(history);
        return getRandomPathFrom(
          tempHistory[tempHistory.length - 2],
          distance + 1,
          tempHistory.slice(0, tempHistory.length - 1),
          cb);
      }
    } else if (history.length === 0) {
      return getRandomPathFrom(
        history[history.length - 2],
        distance + 1,
        history.slice(0, history.length - 1),
        cb);
    } else {
      return cb(new Error('Error getting wiki page.'));
    }
  });
};

const generate = ({ initArticle, goalArticle, par }, cb) => {
  if (initArticle && !goalArticle) {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g;
    if (initArticle.match(urlRegex)) { // If the initArticle is a url
      getRandomPathFrom(initArticle, par, [], cb);
    } else { // If it isn't a url
      return cb(new Error('Invalid wiki url'));
    }
  } else if (!initArticle && goalArticle) {
    getRandomPathTo(goalArticle, par, [], (error, history) => {
      if (error) {
        return cb(error);
      }
      return cb(null, history);
    });
  } else if (initArticle && goalArticle) {
    getPath(initArticle, goalArticle, cb);
  } else {
    getRandomPathFrom('https://en.wikipedia.org/wiki/Special:Random', par, [], cb);
  }
};

/**
 * Takes a par and callback to generate a random link and a goal
 */
export default {
  generate
};
