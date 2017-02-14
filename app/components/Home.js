import React, { Component } from 'react';
import { Link } from 'react-router';
import { Form, Col, Row, FormControl, ControlLabel, Button } from 'react-bootstrap';
import classNames from 'classnames';
import styles from './Home.css';
import { generateRandom } from '../utils/generate';


export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [],
      minPar: 3,
      maxPar: 20,
      body: null,
      clicks: null,
      initArt: '',
      goalArt: '',
    };
    this.refresh = this.refresh.bind(this);
  }

  componentDidMount() {
    this.refresh();
  }

  refresh() {
    const par = Math.floor((Math.random() *
    (this.state.maxPar - this.state.minPar)) + this.state.minPar);
    generateRandom(par, (history) => {
      console.log(history);
      this.setState({ history, clicks: null });
    });
  }

  render() {
    return (
      <div>
        <div className={styles.container}>
          <Row className={classNames(styles.row)}>
            {
              this.state.history.length > 0
              ? <h4>Get from {` ${this.state.history[0].title} `}
                to {` ${this.state.history[this.state.history.length - 1].title} `} with a
                par of {` ${this.state.history.length - 1}.`} Current clicks: {` ${this.state.clicks ? this.state.clicks : 0}.`}</h4>
              : null
            }
          </Row>
          <Form inline>
            <Row className={classNames(styles.row, styles.options)}>
              <Col componentClass={ControlLabel} xs={2}>
                Initial Article
              </Col>
              <Col xs={3}>
                <FormControl type="text" placeholder={this.state.history[0] ? this.state.history[0].link : ''} onChange={(event) => { this.setState({ initArt: event.target.value }); }} />
              </Col>
              <Col componentClass={ControlLabel} xs={2}>
                Minimum Par
              </Col>
              <Col xs={3}>
                <FormControl type="text" placeholder={this.state.minPar ? this.state.minPar : ''} onChange={(event) => { this.setState({ minPar: event.target.value }); }} />
              </Col>
              <Col componentClass={ControlLabel} xs={2}>
                Maximum Par
              </Col>
              <Col xs={3}>
                <FormControl type="text" placeholder={this.state.maxPar ? this.state.maxPar : ''} onChange={(event) => { this.setState({ maxPar: event.target.value }); }} />
              </Col>
              <Col xs={2}>
                <Button bsStyle="default" onClick={() => { this.refresh(); }}>Refresh</Button>
              </Col>
            </Row>
          </Form>
          <div>
            {this.state.history[0] ?
              <object
                type="text/html" data={this.state.history[0].link} width="100%" height="600px"
                onLoad={() => {
                  if (this.state.clicks !== null) {
                    this.setState({ clicks: this.state.clicks + 1 });
                  } else {
                    this.setState({ clicks: 0 });
                  }
                }}
              />
              : null}
          </div>
        </div>
      </div>
    );
  }
}
