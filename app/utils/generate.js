import request from 'request';

// https://en.wikipedia.org/wiki/Special:Random is the link to a random page

/**
 * getTitle: Gets the title from an article on wikipedia
 * @param {string} body - The html contents of the article
 * @return {string} The title of the wikipedia article
 */
const getTitle = (body) => {
  let title = body.match(/<title>(.+) - Wikipedia<\/title>/i)[1];
  const parser = new DOMParser();
  const dom = parser.parseFromString(
    `<!doctype html><body>${title}`,
    'text/html');
  title = dom.body.textContent;
  return title;
};

/**
 * getWikiLinks: Gets all links to other wikipedia articles from an article on wikipedia
 * @param {string} body - The html contents of the article
 * @return {string[]} - An array of links to other articles
 */
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

/**
 * getLinksToPath: Gets all links from other wikipedia articles to an article on wikipedia
 * @param {string} title - The title of the wikipedia article to get the links to
 * @param {function} cb - The callback that returns the list of links
 */
const getLinksToPath = (title, cb) => {
  request(`https://en.wikipedia.org/w/index.php?title=Special%3AWhatLinksHere&limit=500&target=${title}&namespace=0`, (error, response, body) => {
    if (error) {
      return cb(error);
    }
    return cb(null, getWikiLinks(body).filter((url) => !url.includes(title)));
  });
};

/**
 * Path: A construct to keep track of possible paths to wikipedia articles. Used in BFS of wikipedia
 * to find a path between two articles
 * @class
 */
class Path {
  /**
   * @constructs Path
   * @param {Path[]} An array of path objects
   */
  constructor(path) {
    this.path = path;
  }

  /**
   * generate: Creates an array of possible paths from the last wikipedia article in the path array
   * @promise {Path[]} a list of paths that could result from the current path
   * @reject {Error}
   */
  async generate() {
    return new Promise((resolve, reject) => {
      request(this.path[this.path.length - 1], (error, response, body) => {
        if (!error && response.statusCode === 200) {
          const links = getWikiLinks(body);
          const newPaths = [];
          links.forEach((link) => { // For each link on the article, generate another path object
            // The new path object takes the same history and add the new link
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

/**
 * turnPathToLink: Turns a url into an object that has the title and link
 * @param {string} path - The url of the wikipedia article
 * @return {Object}
 * Object.title {string} - The title of the wikipedia article
 * Object.link {string} - The url of the wikipedia article
 */
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

/**
 * getPath: Uses BFS to generate a path between two wikipedia articles. This function is currently
 * memory expensive, and should not be used with a depth greater than three. Goes depth by depth,
 * waiting for the all paths to finish the search before moving onto the next depth
 * @param {string} url1 - The initial article to start from
 * @param {string} url2 - The goal article to get to
 * @param {function} cb - The callback that returns the an array of objects
 * Object.title {string} - The title of the wikipedia article
 * Object.link {string} - The url of the wikipedia article
 */
const getPath = async (url1, url2, cb) => {
  const paths = [];
  paths.push(new Path([url1]));
  try { // Loop through all paths generated paths until we encounter the goal url
    while (true) { // eslint-disable-line
      let potentialPath =
      paths.filter((finalPath) => (finalPath.path.includes(url2)));
      if (potentialPath.length > 0) { // If any path contains the goal url
        potentialPath = potentialPath[0].path;
        const finalPath = [];
        potentialPath.map(async (path) => {
          try {
            finalPath.push(turnPathToLink(path)); // Turn all the url to link objects
          } catch (e) {
            return cb(e);
          }
        });
        return cb(null, await Promise.all(finalPath)); // eslint-disable-line
      }
      const generateFunctions = [];
      while (paths.length > 0) {
        generateFunctions.push(paths.pop().generate()); // Create an array of generate functions
      }
      // Wait for all generate functions to finish before moving onto the next depth
      const results = await Promise.all(generateFunctions); //eslint-disable-line
      results.forEach((path) => {
        paths.push(...path);
      });
    }
  } catch (e) {
    return cb(e);
  }
};

/**
 * getRandomPathTo: Recursive function to generate a path from a random wikipedia article
 * to the specified wikipedia article
 * @param {string} url - The url of the current wikipedia article
 * @param {number} distance - The distance between the two wikipedia articles
 * @param {object[]} history - An array of wikipedia articles that it has traveled through
 * Object.title {string} - The title of the wikipedia article
 * Object.link {string} - The link to the wikipedia article
 * @param {function} cb - The callback function returning the history of wikipedia articles traveled
 */
const getRandomPathTo = (url, distance, history, cb) => {
  const tempHistory = history;
  if (distance <= 0) {
    return cb(null, history);
  }
  try {
    const linkRegex = /(\/wiki\/)(.*)/gi;
    const linkTitle = linkRegex.exec(url)[2];
    getLinksToPath(linkTitle, (err, links) => {
      const nextLink = links[Math.floor(Math.random() * (links.length - 1))]; // Get a random link
      request(url, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          history.unshift({ title: getTitle(body), link: url }); // Add the article to the history
          return getRandomPathTo(nextLink, distance - 1, history, cb);
        } else if (history.length === 0) {
          return getRandomPathTo( // Go back in the path and try again
            history[history.length - 2],
            distance + 1,
            history.slice(0, history.length - 1),
            cb);
        }
        return cb(new Error('Error getting wiki page.'));
      });
    });
  } catch (e) { // Go back in the path and try again
    console.log(e);
    console.log(history);
    return getRandomPathTo(
      tempHistory[tempHistory.length - 2],
      distance + 1,
      tempHistory.slice(0, tempHistory.length - 1),
      cb);
  }
};

/**
 * getRandomPathFrom: Recursive function to generate a path from the specified wikipedia article
 * to a random one
 * @param {string} url - The url of the current wikipedia article
 * @param {number} distance - The distance between the two wikipedia articles
 * @param {object[]} history - An array of wikipedia articles that it has traveled through
 * Object.title {string} - The title of the wikipedia article
 * Object.link {string} - The link to the wikipedia article
 * @param {function} cb - The callback function returning the history of wikipedia articles traveled
 */
const getRandomPathFrom = (url, distance, history, cb) => {
  request(url, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const tempHistory = history;
      try {
        const title = getTitle(body);
        const links = getWikiLinks(body);
        const nextLink = links[Math.floor(Math.random() * (links.length - 1))]; // Get a random link
        history.push({ title, link: (response.request.uri.href) }); // Add the article to history
        if (distance <= 0) {
          return cb(null, history);
        }
        return getRandomPathFrom(nextLink, distance - 1, history, cb);
      } catch (e) {
        console.log(e);
        console.log(history);
        return getRandomPathFrom( // Go back in the history and try again
          tempHistory[tempHistory.length - 2],
          distance + 1,
          tempHistory.slice(0, tempHistory.length - 1),
          cb);
      }
    } else if (history.length === 0) { // Go back in the history and try again
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

/**
 * generate: The main function to generate paths to and from wikipedia articles.
 * If only an initial article is given, generate a path to a random article from the given one
 * with the distance of 'par'
 * If only a goal article is given, generate a path from a random article to the given one
 * with the distance of 'par'
 * If both a goal and initial article is given, generate a path between the two
 * If nothing is given, just generate a random initial article and random goal article
 * @param {Object}
 * @param {string} Object.initArticle - The url of the initial article to start from
 * @param {string} Object.goalArticle - The url of the goal article to get to
 * @param {number} Object.par - The final distance of the path
 * @param {function} cb - The callback function that returns the path(array) of link objects
 * Link: Object.title {string} - The title of the wikipedia article
 * Link: Object.link {string} - The link to the wikipedia article
 */
const generate = ({ initArticle, goalArticle, par }, cb) => {
  if (initArticle && !goalArticle) { // Generate path from
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g;
    if (initArticle.match(urlRegex)) { // If the initArticle is a url
      getRandomPathFrom(initArticle, par, [], cb);
    } else { // If it isn't a url
      return cb(new Error('Invalid wiki url'));
    }
  } else if (!initArticle && goalArticle) { // Generate path to
    getRandomPathTo(goalArticle, par, [], (error, history) => {
      if (error) {
        return cb(error);
      }
      return cb(null, history);
    });
  } else if (initArticle && goalArticle) { // Generate path between
    getPath(initArticle, goalArticle, cb);
  } else {
    getRandomPathFrom('https://en.wikipedia.org/wiki/Special:Random', par, [], cb); // Generate random
  }
};

export default {
  generate
};
