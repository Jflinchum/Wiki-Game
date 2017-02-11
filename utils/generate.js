// https://en.wikipedia.org/wiki/Special:Random is the link to a random page
import request from 'request';

const getTitle = (body) => {
  const title = body.match(/<title>(.+)<\/title>/i)[1];
  return title;
  // return title.substring(7, title.length - 8);
};

const getLinks = (body) => {
  const regex = /<a href="\/wiki\/(.+)(" title)(.+)?">/gi;
  const matches = [];
  let match = [];
  while ((match = regex.exec(body)) != null) {
    if (!match[1].includes(':')) {
      matches.push(match[0]);
    }
  }
  return matches;
};

const getGoal = (url, distance, history, cb) => {
  request(url, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const title = getTitle(body);
      const links = getLinks(body);
      const nextLink = links[Math.floor(Math.random() * (links.length + 1))];
      const regex = /\/wiki\/.+?(?=")/;
      const nextWikiLink = `https://en.wikipedia.org${regex.exec(nextLink)}`;
      history.push({title, link: (response.request.uri.href)});
      if (distance <= 0) {
        return cb({title, link: (response.request.uri.href)}, history);
      } else {
        return getGoal(nextWikiLink, distance - 1, history, cb);
      }
    } else {
      return getGoal(history[history.length - 1], distance + 1, history.slice(0, history.length - 1), cb);
    }
  });
};

/**
 * Takes a par and callback to generate a random link and a goal
 */
const generateRandom = (par, cb) => {
  return getGoal('https://en.wikipedia.org/wiki/Special:Random', par, [], cb);
};

generateRandom(10, (link, history) => { console.log(link); console.log(history); });
