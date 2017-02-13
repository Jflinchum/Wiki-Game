// https://en.wikipedia.org/wiki/Special:Random is the link to a random page
import request from 'request';

const getTitle = (body) => {
  const title = body.match(/<title>(.+) - Wikipedia<\/title>/i)[1];
  return title;
};

const getLinks = (body) => {
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

// request('https://en.wikipedia.org/wiki/Clivina_okutanii', (error, response, body) => {
//   console.log(getLinks(body));
// });

const getGoal = (url, distance, history, cb) => {
  request(url, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const tempHistory = history;
      try {
        const title = getTitle(body);
        const links = getLinks(body);
        const nextLink = links[Math.floor(Math.random() * (links.length - 1))];
        history.push({ title, link: (response.request.uri.href) });
        if (distance <= 0) {
          return cb(history);
        }
        return getGoal(nextLink, distance - 1, history, cb);
      } catch (e) {
        console.log(e);
        console.log(history);
        return getGoal(
          tempHistory[tempHistory.length - 2],
          distance + 1,
          tempHistory.slice(0, tempHistory.length - 1),
          cb);
      }
    } else {
      return getGoal(
        history[history.length - 2],
        distance + 1,
        history.slice(0, history.length - 1),
        cb);
    }
  });
};

const generateRandom = (par, cb) => getGoal('https://en.wikipedia.org/wiki/Special:Random', par, [], cb);

/**
 * Takes a par and callback to generate a random link and a goal
 */
export default {
  generateRandom
};

// generateRandom(15, (history) => { console.log(history); });
