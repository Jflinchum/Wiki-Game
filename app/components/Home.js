import React, { Component } from 'react';
import { Link } from 'react-router';
import request from 'request';
import styles from './Home.css';
import { generateRandom } from '../utils/generate';


export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [],
      par: 3
    };
  }

  componentDidMount() {
    const par = Math.floor(Math.random() * (18)) + 3;
    generateRandom(par, (history) => {
      console.log(history);
      request(history[0].link, (error, response, body) => {
        this.setState({ history, par, body });
      });
    });
  }

  render() {
    return (
      <div>
        <div className={styles.container}>
          {
            this.state.history.length > 0
            ? <h4>Get from {` ${this.state.history[0].title} `}
              to {` ${this.state.history[this.state.history.length - 1].title} `} with a
              par of {` ${this.state.par}.`}</h4>
            : null
          }
          <div>
            {this.state.history[0] ? <object type="text/html" data={this.state.history[0].link} width="800px" height="600px" style={{ overflow: 'auto', border: '5px', ridge: 'blue' }} /> : null}
          </div>
        </div>
      </div>
    );
  }
}
